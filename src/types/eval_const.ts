import Decimal from "decimal.js";
import {
    BinaryOperation,
    Conditional,
    ElementaryTypeNameExpression,
    EtherUnit,
    Expression,
    FunctionCall,
    FunctionCallKind,
    Identifier,
    IndexAccess,
    Literal,
    LiteralKind,
    MemberAccess,
    TimeUnit,
    TupleExpression,
    UnaryOperation,
    VariableDeclaration
} from "../ast";
import { pp } from "../misc";
import { BytesType, FixedBytesType, IntType, NumericLiteralType, StringType } from "./ast";
import { InferType } from "./infer";
import { BINARY_OPERATOR_GROUPS, SUBDENOMINATION_MULTIPLIERS, clampIntToType } from "./utils";
/**
 * Tune up precision of decimal values to follow Solidity behavior.
 * Be careful with precision - setting it to large values causes NodeJS to crash.
 *
 * @see https://mikemcl.github.io/decimal.js/#precision
 */
Decimal.set({ precision: 100 });

export type Value = Decimal | boolean | string | bigint | Buffer;

export class EvalError extends Error {
    expr?: Expression;

    constructor(msg: string, expr?: Expression) {
        super(msg);

        this.expr = expr;
    }
}

export class NonConstantExpressionError extends EvalError {
    constructor(expr: Expression) {
        super(`Found non-constant expression ${pp(expr)} during constant evaluation`, expr);
    }
}

function str(value: Value): string {
    return value instanceof Decimal ? value.toString() : pp(value);
}

function promoteToDec(v: Value): Decimal {
    if (v instanceof Decimal) {
        return v;
    }

    if (typeof v === "bigint") {
        return new Decimal(v.toString());
    }

    if (typeof v === "string") {
        return new Decimal(v === "" ? 0 : "0x" + Buffer.from(v, "utf-8").toString("hex"));
    }

    if (v instanceof Buffer) {
        return new Decimal(v.length === 0 ? 0 : "0x" + v.toString("hex"));
    }

    throw new Error(`Expected number not ${v}`);
}

function demoteFromDec(d: Decimal): Decimal | bigint {
    return d.isInt() ? BigInt(d.toFixed()) : d;
}

export function isConstant(expr: Expression | VariableDeclaration): boolean {
    if (expr instanceof Literal) {
        return true;
    }

    if (expr instanceof UnaryOperation && isConstant(expr.vSubExpression)) {
        return true;
    }

    if (
        expr instanceof VariableDeclaration &&
        expr.constant &&
        expr.vValue &&
        isConstant(expr.vValue)
    ) {
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

    if (expr instanceof Identifier || expr instanceof MemberAccess) {
        return (
            expr.vReferencedDeclaration instanceof VariableDeclaration &&
            isConstant(expr.vReferencedDeclaration)
        );
    }

    if (expr instanceof IndexAccess) {
        return (
            isConstant(expr.vBaseExpression) &&
            expr.vIndexExpression !== undefined &&
            isConstant(expr.vIndexExpression)
        );
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

export function evalLiteralImpl(
    kind: LiteralKind,
    value: string,
    subdenomination?: TimeUnit | EtherUnit
): Value {
    if (kind === LiteralKind.Bool) {
        return value === "true";
    }

    if (kind === LiteralKind.HexString) {
        return Buffer.from(value, "hex");
    }

    if (kind === LiteralKind.String || kind === LiteralKind.UnicodeString) {
        return value;
    }

    if (kind === LiteralKind.Number) {
        const dec = new Decimal(value.replaceAll("_", ""));
        const val = dec.isInteger() ? BigInt(dec.toFixed()) : dec;

        if (subdenomination) {
            const multiplier = SUBDENOMINATION_MULTIPLIERS.get(subdenomination);

            if (multiplier === undefined) {
                throw new EvalError(`Unknown denomination ${subdenomination}`);
            }

            if (val instanceof Decimal) {
                return demoteFromDec(val.times(multiplier));
            }

            return val * BigInt(multiplier.toFixed());
        }

        return val;
    }

    throw new EvalError(`Unsupported literal kind "${kind}"`);
}

export function evalUnaryImpl(operator: string, value: Value): Value {
    if (operator === "!") {
        if (typeof value === "boolean") {
            return !value;
        }

        throw new EvalError(`Expected ${str(value)} to be boolean`);
    }

    if (operator === "~") {
        if (typeof value === "bigint") {
            return ~value;
        }

        throw new EvalError(`Expected ${str(value)} to be a bigint`);
    }

    if (operator === "+") {
        if (value instanceof Decimal || typeof value === "bigint") {
            return value;
        }

        throw new EvalError(`Expected ${str(value)} to be a bigint or a decimal`);
    }

    if (operator === "-") {
        if (value instanceof Decimal) {
            return value.negated();
        }

        if (typeof value === "bigint") {
            return -value;
        }

        throw new EvalError(`Expected ${str(value)} to be a bigint or a decimal`);
    }

    throw new EvalError(`Unable to process ${operator}${str(value)}`);
}

export function evalBinaryImpl(operator: string, left: Value, right: Value): Value {
    if (BINARY_OPERATOR_GROUPS.Logical.includes(operator)) {
        if (!(typeof left === "boolean" && typeof right === "boolean")) {
            throw new EvalError(`${operator} expects booleans not ${str(left)} and ${str(right)}`);
        }

        if (operator === "&&") {
            return left && right;
        }

        if (operator === "||") {
            return left || right;
        }

        throw new EvalError(`Unknown logical operator ${operator}`);
    }

    if (BINARY_OPERATOR_GROUPS.Equality.includes(operator)) {
        if (typeof left === "string" && typeof right === "string") {
            throw new EvalError(
                `${operator} not allowed for strings ${str(left)} and ${str(right)}`
            );
        }

        let isEqual: boolean;

        if (typeof left === "boolean" || typeof right === "boolean") {
            isEqual = left === right;
        } else {
            const leftDec = promoteToDec(left);
            const rightDec = promoteToDec(right);

            isEqual = leftDec.equals(rightDec);
        }

        if (operator === "==") {
            return isEqual;
        }

        if (operator === "!=") {
            return !isEqual;
        }

        throw new EvalError(`Unknown equality operator ${operator}`);
    }

    if (BINARY_OPERATOR_GROUPS.Comparison.includes(operator)) {
        if (typeof left === "string" && typeof right === "string") {
            throw new EvalError(
                `${operator} not allowed for strings ${str(left)} and ${str(right)}`
            );
        }

        const leftDec = promoteToDec(left);
        const rightDec = promoteToDec(right);

        if (operator === "<") {
            return leftDec.lessThan(rightDec);
        }

        if (operator === "<=") {
            return leftDec.lessThanOrEqualTo(rightDec);
        }

        if (operator === ">") {
            return leftDec.greaterThan(rightDec);
        }

        if (operator === ">=") {
            return leftDec.greaterThanOrEqualTo(rightDec);
        }

        throw new EvalError(`Unknown comparison operator ${operator}`);
    }

    if (BINARY_OPERATOR_GROUPS.Arithmetic.includes(operator)) {
        const leftDec = promoteToDec(left);
        const rightDec = promoteToDec(right);

        let res: Decimal;

        if (operator === "+") {
            res = leftDec.plus(rightDec);
        } else if (operator === "-") {
            res = leftDec.minus(rightDec);
        } else if (operator === "*") {
            res = leftDec.times(rightDec);
        } else if (operator === "/") {
            res = leftDec.div(rightDec);
        } else if (operator === "%") {
            res = leftDec.modulo(rightDec);
        } else if (operator === "**") {
            res = leftDec.pow(rightDec);
        } else {
            throw new EvalError(`Unknown arithmetic operator ${operator}`);
        }

        return demoteFromDec(res);
    }

    if (BINARY_OPERATOR_GROUPS.Bitwise.includes(operator)) {
        if (!(typeof left === "bigint" && typeof right === "bigint")) {
            throw new EvalError(`${operator} expects integers not ${str(left)} and ${str(right)}`);
        }

        if (operator === "<<") {
            return left << right;
        }

        if (operator === ">>") {
            return left >> right;
        }

        if (operator === "|") {
            return left | right;
        }

        if (operator === "&") {
            return left & right;
        }

        if (operator === "^") {
            return left ^ right;
        }

        throw new EvalError(`Unknown bitwise operator ${operator}`);
    }

    throw new EvalError(`Unable to process ${str(left)} ${operator} ${str(right)}`);
}

export function evalLiteral(node: Literal): Value {
    try {
        return evalLiteralImpl(
            node.kind,
            node.kind === LiteralKind.HexString ? node.hexValue : node.value,
            node.subdenomination
        );
    } catch (e: unknown) {
        if (e instanceof EvalError) {
            e.expr = node;
        }

        throw e;
    }
}

export function evalUnary(node: UnaryOperation, inference: InferType): Value {
    try {
        const subT = inference.typeOf(node.vSubExpression);
        const res = evalUnaryImpl(node.operator, evalConstantExpr(node.vSubExpression, inference));

        if (subT instanceof IntType && typeof res === "bigint") {
            return clampIntToType(res, subT);
        }

        return res;
    } catch (e: unknown) {
        if (e instanceof EvalError && e.expr === undefined) {
            e.expr = node;
        }

        throw e;
    }
}

export function evalBinary(node: BinaryOperation, inference: InferType): Value {
    try {
        const leftT = inference.typeOf(node.vLeftExpression);
        const rightT = inference.typeOf(node.vRightExpression);

        const res = evalBinaryImpl(
            node.operator,
            evalConstantExpr(node.vLeftExpression, inference),
            evalConstantExpr(node.vRightExpression, inference)
        );

        if (!(leftT instanceof NumericLiteralType && rightT instanceof NumericLiteralType)) {
            const resT = inference.typeOfBinaryOperation(node);

            if (resT instanceof IntType && typeof res === "bigint") {
                return clampIntToType(res, resT);
            }
        }

        return res;
    } catch (e: unknown) {
        if (e instanceof EvalError && e.expr === undefined) {
            e.expr = node;
        }

        throw e;
    }
}

export function evalIndexAccess(node: IndexAccess, inference: InferType): Value {
    const base = evalConstantExpr(node.vBaseExpression, inference);
    const index = evalConstantExpr(node.vIndexExpression as Expression, inference);

    if (!(typeof index === "bigint" || index instanceof Decimal)) {
        throw new EvalError(
            `Unexpected non-numeric index into base in expression ${pp(node)}`,
            node
        );
    }

    const plainIndex = index instanceof Decimal ? index.toNumber() : Number(index);

    if (typeof base === "bigint" || base instanceof Decimal) {
        let baseHex = base instanceof Decimal ? base.toHex().slice(2) : base.toString(16);

        if (baseHex.length % 2 !== 0) {
            baseHex = "0" + baseHex;
        }

        const indexInHex = plainIndex * 2;

        return BigInt("0x" + baseHex.slice(indexInHex, indexInHex + 2));
    }

    if (base instanceof Buffer) {
        const res = base.at(plainIndex);

        if (res === undefined) {
            throw new EvalError(
                `Out-of-bounds index access ${plainIndex} to ${base.toString("hex")}`
            );
        }

        return BigInt(res);
    }

    throw new EvalError(`Unable to process ${pp(node)}`, node);
}

export function evalFunctionCall(node: FunctionCall, inference: InferType): Value {
    if (node.kind !== FunctionCallKind.TypeConversion) {
        throw new EvalError(
            `Expected function call to have kind "${FunctionCallKind.TypeConversion}", but got "${node.kind}" instead`,
            node
        );
    }

    if (!(node.vExpression instanceof ElementaryTypeNameExpression)) {
        throw new EvalError(
            `Expected function call expression to be an ${ElementaryTypeNameExpression.name}, but got "${node.type}" instead`,
            node
        );
    }

    const val = evalConstantExpr(node.vArguments[0], inference);
    const castT = inference.typeOfElementaryTypeNameExpression(node.vExpression).type;

    if (typeof val === "bigint") {
        if (castT instanceof IntType) {
            return clampIntToType(val, castT);
        }

        if (castT instanceof FixedBytesType) {
            return val;
        }
    }

    if (typeof val === "string") {
        if (castT instanceof BytesType) {
            return Buffer.from(val, "utf-8");
        }

        if (castT instanceof FixedBytesType) {
            const buf = Buffer.from(val, "utf-8");

            return BigInt("0x" + buf.slice(0, castT.size).toString("hex"));
        }
    }

    if (val instanceof Buffer) {
        if (castT instanceof StringType) {
            return val.toString("utf-8");
        }

        if (castT instanceof FixedBytesType) {
            return BigInt("0x" + val.slice(0, castT.size).toString("hex"));
        }
    }

    return val;
}

/**
 * Given a constant expression `expr` evaluate it to a concrete `Value`.
 * If `expr` is not constant throw `NonConstantExpressionError`.
 *
 * @todo The order of some operations changed in some version.
 * Current implementation does not yet take it into an account.
 */
export function evalConstantExpr(
    node: Expression | VariableDeclaration,
    inference: InferType
): Value {
    if (!isConstant(node)) {
        throw new NonConstantExpressionError(node);
    }

    if (node instanceof Literal) {
        return evalLiteral(node);
    }

    if (node instanceof UnaryOperation) {
        return evalUnary(node, inference);
    }

    if (node instanceof BinaryOperation) {
        return evalBinary(node, inference);
    }

    if (node instanceof TupleExpression) {
        return evalConstantExpr(node.vOriginalComponents[0] as Expression, inference);
    }

    if (node instanceof Conditional) {
        return evalConstantExpr(node.vCondition, inference)
            ? evalConstantExpr(node.vTrueExpression, inference)
            : evalConstantExpr(node.vFalseExpression, inference);
    }

    if (node instanceof VariableDeclaration) {
        return evalConstantExpr(node.vValue as Expression, inference);
    }

    if (node instanceof Identifier || node instanceof MemberAccess) {
        return evalConstantExpr(
            node.vReferencedDeclaration as Expression | VariableDeclaration,
            inference
        );
    }

    if (node instanceof IndexAccess) {
        return evalIndexAccess(node, inference);
    }

    if (node instanceof FunctionCall) {
        return evalFunctionCall(node, inference);
    }

    /**
     * Note that from the point of view of the type system constant conditionals and
     * indexing in constant array literals are not considered constant expressions.
     * So for now we don't support them, but we may change that in the future.
     */
    throw new EvalError(`Unable to evaluate constant expression ${pp(node)}`, node);
}
