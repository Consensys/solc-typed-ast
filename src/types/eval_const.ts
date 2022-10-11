import Decimal from "decimal.js";
import {
    BinaryOperation,
    Conditional,
    Expression,
    FunctionCall,
    FunctionCallKind,
    Identifier,
    Literal,
    LiteralKind,
    TupleExpression,
    UnaryOperation,
    VariableDeclaration
} from "../ast";
import { pp } from "../misc";
import { binaryOperatorGroups, subdenominationMultipliers } from "./infer";
/**
 * Tune up precision of decimal values to follow Solidity behavior.
 * Be careful with precision - setting it to large values causes NodeJS to crash.
 *
 * @see https://mikemcl.github.io/decimal.js/#precision
 */
Decimal.set({ precision: 100 });

export type Value = Decimal | boolean | string | bigint;

export class EvalError extends Error {
    expr: Expression;

    constructor(e: Expression, msg: string) {
        super(msg);

        this.expr = e;
    }
}

export class NonConstantExpressionError extends EvalError {
    constructor(e: Expression) {
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

export function isConstant(expr: Expression): boolean {
    if (expr instanceof Literal) {
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

    if (expr instanceof Identifier) {
        const decl = expr.vReferencedDeclaration;

        if (
            decl instanceof VariableDeclaration &&
            decl.constant &&
            decl.vValue &&
            isConstant(decl.vValue)
        ) {
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

    return false;
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
        const dec = new Decimal(expr.value.replace(/_/g, ""));
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

/**
 * Given a constant expression `expr` evaluate it to a concrete `Value`.
 * If `expr` is not constant throw `NonConstantExpressionError`.
 *
 * TODO: The order of some operations changed in some version.
 * So perhaps to be fully precise here we will need a compiler version too?
 */
export function evalConstantExpr(expr: Expression): Value {
    if (!isConstant(expr)) {
        throw new NonConstantExpressionError(expr);
    }

    if (expr instanceof Literal) {
        return evalLiteral(expr);
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

    /// Note that from the point of view of the type system constant conditionals and
    /// indexing in constant array literals are not considered constant expressions.
    /// So for now we don't support them, but we may change that in the future.
    throw new EvalError(expr, `Unable to evaluate constant expression ${pp(expr)}`);
}
