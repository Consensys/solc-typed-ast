import Decimal from "decimal.js";
import {
    BinaryOperation,
    Conditional,
    Expression,
    ExternalReferenceType,
    FunctionCall,
    FunctionCallKind,
    Identifier,
    Literal,
    LiteralKind,
    TupleExpression,
    UnaryOperation,
    VariableDeclaration,
    YulExpression,
    YulFunctionCall,
    YulIdentifier,
    YulLiteral,
    YulLiteralKind,
    YulVariableDeclaration
} from "../ast";
import { LatestCompilerVersion } from "../compile";
import { pp } from "../misc";
import { YulBuiltinFunctionType } from "./ast";
import { yulBuiltins } from "./builtins";
import { binaryOperatorGroups, subdenominationMultipliers, yulBinaryBuiltinGroups } from "./infer";
/**
 * Tune up precision of decimal values to follow Solidity behavior.
 * Be careful with precision - setting it to large values causes NodeJS to crash.
 *
 * @see https://mikemcl.github.io/decimal.js/#precision
 */
Decimal.set({ precision: 100 });

export type Value = Decimal | boolean | string | bigint;

export class EvalError extends Error {
    expr: Expression | YulExpression;

    constructor(e: Expression | YulExpression, msg: string) {
        super(msg);

        this.expr = e;
    }
}

export class NonConstantExpressionError extends EvalError {
    constructor(e: Expression | YulExpression) {
        super(e, `Found non-constant expression ${pp(e)} during constant evaluation`);
    }
}

function promoteToDec(v: Value): Decimal {
    if (!(typeof v === "bigint" || v instanceof Decimal)) {
        throw new Error(`Expected number not ${v}`);
    }

    return v instanceof Decimal ? v : new Decimal(v.toString());
}

function demoteFromDec(d: Decimal): Decimal | bigint {
    return d.isInt() ? BigInt(d.toFixed()) : d;
}

function utf8ToHex(s: string): string {
    return Array.from(new TextEncoder().encode(s), (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

/**
 * Used for evaluating yul constants, where all values are treated as uint256
 */
function coerceInteger(v: Value): bigint {
    if (typeof v === "bigint") return v;
    // If value is a yul literal string, it's already been converted to a BigInt.
    // If it is any other string, it's an illegal reference to a string constant
    if (typeof v === "string")
        throw Error(
            `coerceInteger called with a string - inline assembly can not reference external string literals`
        );
    if (v instanceof Decimal) return BigInt(v.toFixed());
    return v ? BigInt(1) : BigInt(0);
}

export function isConstant(
    expr: Expression | YulExpression,
    version: string = LatestCompilerVersion
): boolean {
    if (expr instanceof Literal) {
        return true;
    }

    if (expr instanceof YulLiteral) {
        return true;
    }

    if (expr instanceof UnaryOperation && isConstant(expr.vSubExpression)) {
        return true;
    }

    if (
        expr instanceof BinaryOperation &&
        isConstant(expr.vLeftExpression) &&
        isConstant(expr.vRightExpression)
    ) {
        return true;
    }

    if (
        expr instanceof TupleExpression &&
        !expr.isInlineArray &&
        expr.vOriginalComponents.length === 1 &&
        expr.vOriginalComponents[0] &&
        isConstant(expr.vOriginalComponents[0])
    ) {
        return true;
    }

    /// TODO: We can be more precise here. Conditionals are also constant if
    /// 1) vCondition is constant, and only the selected branch is constant
    /// 2) vCondition is not constant, but both branches are constant and equal (not likely in practice)
    if (
        expr instanceof Conditional &&
        isConstant(expr.vCondition) &&
        isConstant(expr.vTrueExpression) &&
        isConstant(expr.vFalseExpression)
    ) {
        return true;
    }

    if (expr instanceof Identifier || expr instanceof YulIdentifier) {
        const decl = expr.vReferencedDeclaration;

        if (
            decl instanceof VariableDeclaration &&
            decl.constant &&
            decl.vValue &&
            isConstant(decl.vValue)
        ) {
            return true;
        }

        if (decl instanceof YulVariableDeclaration && decl.value && isConstant(decl.value)) {
            return true;
        }
    }

    if (
        expr instanceof FunctionCall &&
        expr.kind === FunctionCallKind.TypeConversion &&
        isConstant(expr.vArguments[0])
    ) {
        return true;
    }

    if (
        expr instanceof YulFunctionCall &&
        expr.vFunctionCallType === ExternalReferenceType.Builtin
    ) {
        const builtinFunction = yulBuiltins.getFieldForVersion(expr.vFunctionName.name, version) as
            | YulBuiltinFunctionType
            | undefined;
        if (builtinFunction?.isPure && expr.vArguments.every((arg) => isConstant(arg))) {
            return true;
        }
    }

    return false;
}

function evalYulLiteral(expr: YulLiteral): bigint {
    if (expr.kind === YulLiteralKind.String) {
        return BigInt(`0x${utf8ToHex(expr.value as string).padEnd(64, "0")}`);
    }
    if (expr.kind === YulLiteralKind.Bool) {
        return expr.value === "true" ? BigInt(1) : BigInt(0);
    }
    if (expr.kind === YulLiteralKind.Number) {
        return BigInt(expr.value);
    }

    throw new EvalError(expr, `Unrecognized yul literal kind "${expr.kind}"`);
}

function evalLiteral(expr: Literal): Value {
    if (expr.kind === LiteralKind.Bool) {
        return expr.value === "true";
    }

    if (expr.kind === LiteralKind.String || expr.kind === LiteralKind.UnicodeString) {
        return expr.value;
    }

    if (expr.kind === LiteralKind.HexString) {
        return expr.hexValue;
    }

    if (expr.kind === LiteralKind.Number) {
        const dec = new Decimal(expr.value.replaceAll("_", ""));
        const val = dec.isInteger() ? BigInt(dec.toFixed()) : dec;

        if (expr.subdenomination !== undefined) {
            if (subdenominationMultipliers[expr.subdenomination] === undefined) {
                throw new EvalError(expr, `Unknown denomination ${expr.subdenomination}`);
            }

            if (val instanceof Decimal) {
                return demoteFromDec(val.times(subdenominationMultipliers[expr.subdenomination]));
            }

            return val * BigInt(subdenominationMultipliers[expr.subdenomination].toFixed());
        }

        return val;
    }

    throw new EvalError(expr, `Unsupported literal kind "${expr.kind}"`);
}

function evalUnary(expr: UnaryOperation): Value {
    const subVal = evalConstantExpr(expr.vSubExpression);

    if (expr.operator === "!") {
        if (!(typeof subVal === "boolean")) {
            throw new EvalError(
                expr.vSubExpression,
                `Expected a boolean in ${pp(expr.vSubExpression)} not ${subVal}`
            );
        }

        return !subVal;
    }

    if (expr.operator === "~") {
        if (typeof subVal === "bigint") {
            return ~subVal;
        }

        throw new EvalError(
            expr.vSubExpression,
            `Expected an integer number in ${pp(expr.vSubExpression)} not ${subVal}`
        );
    }

    if (expr.operator === "+") {
        if (subVal instanceof Decimal || typeof subVal === "bigint") {
            return subVal;
        }

        throw new EvalError(
            expr.vSubExpression,
            `Expected a number in ${pp(expr.vSubExpression)} not ${subVal}`
        );
    }

    if (expr.operator === "-") {
        if (subVal instanceof Decimal) {
            return subVal.negated();
        }

        if (typeof subVal === "bigint") {
            return -subVal;
        }

        throw new EvalError(
            expr.vSubExpression,
            `Expected a number in ${pp(expr.vSubExpression)} not ${subVal}`
        );
    }

    throw new EvalError(expr, `NYI unary operator ${expr.operator}`);
}

function evalBinaryLogic(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    if (!(typeof lVal === "boolean" && typeof lVal === "boolean")) {
        throw new EvalError(expr, `${op} expects booleans not ${lVal} and ${rVal}`);
    }

    if (op === "&&") {
        return lVal && rVal;
    }

    if (op === "||") {
        return lVal || rVal;
    }

    throw new Error(`Unknown logic op ${op}`);
}

function evalBinaryEquality(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    let equal: boolean;

    if (typeof lVal === "string" || typeof rVal === "string") {
        throw new EvalError(expr, `Comparison not allowed for strings ${lVal} and ${rVal}`);
    }

    if (lVal instanceof Decimal && rVal instanceof Decimal) {
        equal = lVal.equals(rVal);
    } else {
        equal = lVal === rVal;
    }

    if (expr.operator === "==") {
        return equal;
    }

    if (expr.operator === "!=") {
        return !equal;
    }

    throw new EvalError(expr, `Unknown equality op ${expr.operator}`);
}

function evalBinaryComparison(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    const lDec = promoteToDec(lVal);
    const rDec = promoteToDec(rVal);

    if (op === "<") {
        return lDec.lessThan(rDec);
    }

    if (op === "<=") {
        return lDec.lessThanOrEqualTo(rDec);
    }

    if (op === ">") {
        return lDec.greaterThan(rDec);
    }

    if (op === ">=") {
        return lDec.greaterThanOrEqualTo(rDec);
    }

    throw new EvalError(expr, `Unknown comparison op ${expr.operator}`);
}

function evalBinaryArithmetic(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    const lDec = promoteToDec(lVal);
    const rDec = promoteToDec(rVal);

    let res: Decimal;

    if (op === "+") {
        res = lDec.plus(rDec);
    } else if (op === "-") {
        res = lDec.minus(rDec);
    } else if (op === "*") {
        res = lDec.times(rDec);
    } else if (op === "/") {
        res = lDec.div(rDec);
    } else if (op === "%") {
        res = lDec.modulo(rDec);
    } else if (op === "**") {
        res = lDec.pow(rDec);
    } else {
        throw new EvalError(expr, `Unknown arithmetic op ${expr.operator}`);
    }

    return demoteFromDec(res);
}

function evalBinaryBitwise(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    if (!(typeof lVal === "bigint" && typeof rVal === "bigint")) {
        throw new EvalError(expr, `${op} expects integers not ${lVal} and ${rVal}`);
    }

    if (op === "<<") {
        return lVal << rVal;
    }

    if (op === ">>") {
        return lVal >> rVal;
    }

    if (op === "|") {
        return lVal | rVal;
    }

    if (op === "&") {
        return lVal & rVal;
    }

    if (op === "^") {
        return lVal ^ rVal;
    }

    throw new EvalError(expr, `Unknown bitwise op ${expr.operator}`);
}

function evalBinary(expr: BinaryOperation): Value {
    const lVal = evalConstantExpr(expr.vLeftExpression);
    const rVal = evalConstantExpr(expr.vRightExpression);

    if (binaryOperatorGroups.Logical.includes(expr.operator)) {
        return evalBinaryLogic(expr, lVal, rVal);
    }

    if (binaryOperatorGroups.Equality.includes(expr.operator)) {
        return evalBinaryEquality(expr, lVal, rVal);
    }

    if (binaryOperatorGroups.Comparison.includes(expr.operator)) {
        return evalBinaryComparison(expr, lVal, rVal);
    }

    if (binaryOperatorGroups.Arithmetic.includes(expr.operator)) {
        return evalBinaryArithmetic(expr, lVal, rVal);
    }

    if (binaryOperatorGroups.Bitwise.includes(expr.operator)) {
        return evalBinaryBitwise(expr, lVal, rVal);
    }

    throw new EvalError(expr, `Unknown binary op ${expr.operator}`);
}

function evalYulBinaryComparison(expr: YulFunctionCall, lVal: bigint, rVal: bigint): Value {
    const op = expr.vFunctionName.name;

    const lDec = promoteToDec(lVal);
    const rDec = promoteToDec(rVal);

    if (op === "lt" || op === "slt") {
        return coerceInteger(lDec.lessThan(rDec));
    }

    if (op === "gt" || op === "sgt") {
        return coerceInteger(lDec.greaterThan(rDec));
    }

    if (op === "eq") {
        return coerceInteger(lDec.eq(rDec));
    }

    throw new EvalError(expr, `Unknown comparison op ${expr.vFunctionName}`);
}

function evalYulBinaryArithmetic(expr: YulFunctionCall, lVal: bigint, rVal: bigint): Value {
    const op = expr.vFunctionName.name;

    const lDec = promoteToDec(lVal);
    const rDec = promoteToDec(rVal);

    let res: Decimal;

    if (op === "add") {
        res = lDec.plus(rDec);
    } else if (op === "sub") {
        res = lDec.minus(rDec);
    } else if (op === "mul") {
        res = lDec.times(rDec);
    } else if (op === "div" || op === "sdiv") {
        res = lDec.div(rDec);
    } else if (op === "mod" || op === "smod") {
        res = lDec.modulo(rDec);
    } else if (op === "exp") {
        res = lDec.pow(rDec);
    } else if (op === "signextend") {
        // @todo Implement `signextend`
        throw new EvalError(expr, `Unimplemented binary op ${expr.vFunctionName}`);
    } else {
        throw new EvalError(expr, `Unknown arithmetic op ${expr.vFunctionName}`);
    }

    return coerceInteger(res);
}

function evalYulBinaryBitwise(expr: YulFunctionCall, lVal: bigint, rVal: bigint): Value {
    const op = expr.vFunctionName.name;

    if (op === "shl") {
        return rVal << lVal;
    }

    // @todo How should sar be handled differently from shr?
    if (op === "shr" || op === "sar") {
        return rVal >> lVal;
    }

    if (op === "or") {
        return lVal | rVal;
    }

    if (op === "and") {
        return lVal & rVal;
    }

    if (op === "xor") {
        return lVal ^ rVal;
    }

    if (op === "byte") {
        const shiftSize = BigInt(248 - Number(lVal) * 8);
        return (rVal >> shiftSize) & BigInt(0xff);
    }

    throw new EvalError(expr, `Unknown bitwise op ${expr.vFunctionName}`);
}

function evalYulUnary(expr: YulFunctionCall) {
    if (expr.vArguments.length !== 1) {
        throw new EvalError(
            expr,
            `Expected a single argument in unary builtin function ${pp(expr)}`
        );
    }

    const subVal = coerceInteger(evalConstantExpr(expr.vArguments[0]));

    if (expr.vFunctionName.name === "iszero") {
        return coerceInteger(subVal === BigInt(0));
    }

    if (expr.vFunctionName.name === "not") {
        return ~subVal;
    }

    throw new EvalError(expr, `NYI unary operator ${expr.vFunctionName}`);
}

function evalYulBinary(expr: YulFunctionCall) {
    if (expr.vArguments.length !== 2) {
        throw new EvalError(expr, `Expected two arguments in binary builtin function ${pp(expr)}`);
    }

    const [lVal, rVal] = expr.vArguments.map((arg) => coerceInteger(evalConstantExpr(arg)));

    const op = expr.vFunctionName.name;

    if (yulBinaryBuiltinGroups.Comparison.includes(op)) {
        return evalYulBinaryComparison(expr, lVal, rVal);
    }

    if (yulBinaryBuiltinGroups.Arithmetic.includes(op)) {
        return evalYulBinaryArithmetic(expr, lVal, rVal);
    }

    if (yulBinaryBuiltinGroups.Bitwise.includes(op)) {
        return evalYulBinaryBitwise(expr, lVal, rVal);
    }

    throw new EvalError(expr, `Unknown binary op ${expr.vFunctionName}`);
}

function evalYulTernary(expr: YulFunctionCall): Value {
    if (expr.vArguments.length !== 3) {
        throw new EvalError(
            expr,
            `Expected three arguments in ternary builtin function ${pp(expr)}`
        );
    }
    const op = expr.vFunctionName.name;

    const [dec1, dec2, dec3] = expr.vArguments.map((arg) =>
        promoteToDec(coerceInteger(evalConstantExpr(arg)))
    );

    if (op === "mulmod") {
        return coerceInteger(dec1.mul(dec2).mod(dec3));
    }

    if (op === "addmod") {
        return coerceInteger(dec1.add(dec2).mod(dec3));
    }

    throw new EvalError(expr, `Unknown ternary op ${expr.vFunctionName}`);
}

/**
 * Given a constant expression `expr` evaluate it to a concrete `Value`.
 * If `expr` is not constant throw `NonConstantExpressionError`.
 *
 * TODO: The order of some operations changed in some version.
 * So perhaps to be fully precise here we will need a compiler version too?
 */
export function evalConstantExpr(
    expr: Expression | YulExpression,
    version = LatestCompilerVersion
): Value {
    if (!isConstant(expr)) {
        throw new NonConstantExpressionError(expr);
    }

    if (expr instanceof Literal) {
        return evalLiteral(expr);
    }

    if (expr instanceof YulLiteral) {
        return evalYulLiteral(expr);
    }

    if (expr instanceof UnaryOperation) {
        return evalUnary(expr);
    }

    if (expr instanceof BinaryOperation) {
        return evalBinary(expr);
    }

    if (expr instanceof TupleExpression) {
        return evalConstantExpr(expr.vOriginalComponents[0] as Expression);
    }

    if (expr instanceof Conditional) {
        return evalConstantExpr(expr.vCondition)
            ? evalConstantExpr(expr.vTrueExpression)
            : evalConstantExpr(expr.vFalseExpression);
    }

    if (expr instanceof YulIdentifier) {
        const decl = expr.vReferencedDeclaration;
        if (decl instanceof VariableDeclaration) {
            return coerceInteger(evalConstantExpr(decl.vValue as Expression));
        }
        if (decl instanceof YulVariableDeclaration) {
            return coerceInteger(evalConstantExpr(decl.value as YulExpression));
        }
    }

    if (expr instanceof Identifier) {
        const decl = expr.vReferencedDeclaration;

        if (decl instanceof VariableDeclaration) {
            return evalConstantExpr(decl.vValue as Expression);
        }
    }

    if (expr instanceof FunctionCall) {
        /**
         * @todo Implement properly, as Solidity permits overflow and underflow
         * during constant evaluation.
         */
        return evalConstantExpr(expr.vArguments[0]);
    }

    if (
        expr instanceof YulFunctionCall &&
        expr.vFunctionCallType === ExternalReferenceType.Builtin
    ) {
        const builtinFunction = yulBuiltins.getFieldForVersion(expr.vFunctionName.name, version) as
            | YulBuiltinFunctionType
            | undefined;
        if (builtinFunction?.isPure) {
            if (builtinFunction.parameters.length === 1) {
                return evalYulUnary(expr);
            }
            if (builtinFunction.parameters.length === 2) {
                return evalYulBinary(expr);
            }
            if (builtinFunction.parameters.length === 3) {
                return evalYulTernary(expr);
            }
        }
    }
    /// Note that from the point of view of the type system constant conditionals and
    /// indexing in constant array literals are not considered constant expressions.
    /// So for now we don't support them, but we may change that in the future.
    throw new EvalError(expr, `Unable to evaluate constant expression ${pp(expr)}`);
}
