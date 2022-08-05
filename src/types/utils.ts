import Decimal from "decimal.js";
import { lt, satisfies } from "semver";
import {
    ArrayTypeName,
    BinaryOperation,
    Conditional,
    ContractDefinition,
    DataLocation,
    ElementaryTypeName,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    Expression,
    FunctionDefinition,
    FunctionTypeName,
    Literal,
    LiteralKind,
    Mapping,
    ModifierDefinition,
    ParameterList,
    PragmaDirective,
    SourceUnit,
    StructDefinition,
    TypeName,
    UnaryOperation,
    UserDefinedTypeName,
    UserDefinedValueTypeDefinition,
    VariableDeclaration,
    VariableDeclarationStatement
} from "../ast";
import { assert, eq, pp } from "../misc";
import { ABIEncoderVersion, ABIEncoderVersions } from "./abi";
import {
    AddressType,
    ArrayType,
    BoolType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntLiteralType,
    IntType,
    MappingType,
    PackedArrayType,
    PointerType,
    StringLiteralType,
    StringType,
    TupleType,
    TypeNode,
    UserDefinedType,
    UserDefinition
} from "./ast";

export const operatorGroups = {
    Arithmetic: ["+", "-", "*", "/", "%", "**"],
    Bitwise: ["<<", ">>", "&", "|", "^"],
    Comparison: ["<", ">", "<=", ">="],
    Equality: ["==", "!="],
    Logical: ["&&", "||"]
};

export class SolTypeError extends Error {}

export type VersionDependentType = [TypeNode, string];

export function getTypeForCompilerVersion(
    typing: VersionDependentType,
    compilerVersion: string
): TypeNode | undefined {
    const [type, version] = typing;

    return satisfies(compilerVersion, version) ? type : undefined;
}

/**
 * Given a general type 'pattern' that doesn't contain any data locations, and a data location,
 * produce a concrete instance of the general type for the target location.
 * This is the inverse of `specializeType()`
 *
 * Note that this has to recursively fix sub-parts of compount types such as arrays and maps.
 * Note that this doesn't handle all possible expression types - just the ones that that may appear
 * in a variable declaration.
 *
 * @param type - general type "pattern"
 * @param loc - target location to specialize to
 * @returns specialized type
 */
export function specializeType(type: TypeNode, loc: DataLocation): TypeNode {
    assert(!(type instanceof PointerType), "Unexpected pointer type {0} in concretization.", type);
    assert(!(type instanceof TupleType), "Unexpected tuple type {0} in concretization.", type);

    // bytes and string
    if (type instanceof PackedArrayType) {
        return new PointerType(type, loc);
    }

    if (type instanceof ArrayType) {
        const concreteElT = specializeType(type.elementT, loc);

        return new PointerType(new ArrayType(concreteElT, type.size), loc);
    }

    if (type instanceof UserDefinedType) {
        const def = type.definition;

        assert(
            def !== undefined,
            "Can't concretize user defined type {0} with no corresponding definition.",
            type
        );

        if (def instanceof ContractDefinition) {
            // Contracts are always concretized as storage poitners
            return new PointerType(type, DataLocation.Storage);
        }

        if (def instanceof StructDefinition) {
            return new PointerType(type, loc);
        }

        // Enums are a value type
        return type;
    }

    if (type instanceof MappingType) {
        // Always treat map keys as in-memory copies
        const concreteKeyT = specializeType(type.keyType, DataLocation.Memory);
        // The result of map indexing is always a pointer to a value that lives in storage
        const concreteValueT = specializeType(type.valueType, DataLocation.Storage);
        // Maps always live in storage
        return new PointerType(new MappingType(concreteKeyT, concreteValueT), DataLocation.Storage);
    }

    // TODO: What to do about string literals?
    // All other types are "value" types.
    return type;
}

/**
 * Given a `TypeNode` `type` that is specialized to some storage location,
 * compute the original 'general' type that is independent of location.
 * This is the inverse of `specializeType()`
 *
 * Note that this doesn't handle all possible expression types - just the ones that that may appear
 * in a variable declaration.
 *
 * @param type - specialized type
 * @returns computed generalized type.
 */
export function generalizeType(type: TypeNode): [TypeNode, DataLocation | undefined] {
    if (type instanceof PointerType) {
        const [generalizedTo] = generalizeType(type.to);

        return [generalizedTo, type.location];
    }

    if (type instanceof ArrayType) {
        const [innerT] = generalizeType(type.elementT);

        return [new ArrayType(innerT, type.size), undefined];
    }

    if (type instanceof MappingType) {
        const [genearlKeyT] = generalizeType(type.keyType);
        const [generalValueT] = generalizeType(type.valueType);

        return [new MappingType(genearlKeyT, generalValueT), DataLocation.Storage];
    }

    // The only other types that contains sub-types are the FunctionType and TypeNameType. However those don't
    // get specialized/generalized w.r.t. storage locations.

    return [type, undefined];
}

export function getUserDefinedTypeFQName(def: UserDefinition): string {
    return def.vScope instanceof ContractDefinition ? `${def.vScope.name}.${def.name}` : def.name;
}

export type NamedDef =
    | ContractDefinition
    | StructDefinition
    | EnumDefinition
    | FunctionDefinition
    | ErrorDefinition
    | EventDefinition
    | VariableDeclaration
    | ModifierDefinition
    | UserDefinedValueTypeDefinition;

export function getFQDefName(def: NamedDef): string {
    return def.vScope instanceof ContractDefinition ? `${def.vScope.name}.${def.name}` : def.name;
}

/**
 * Convert a given ast `TypeName` into a `TypeNode`. This produces "general
 * type patterns" without any specific storage information.
 *
 * @param astT - original AST `TypeName`
 * @returns equivalent `TypeNode`.
 */
export function typeNameToTypeNode(astT: TypeName): TypeNode {
    if (astT instanceof ElementaryTypeName) {
        const name = astT.name.trim();

        if (name === "bool") {
            return new BoolType();
        }

        const rxAddress = /^address *(payable)?$/;

        if (rxAddress.test(name)) {
            return new AddressType(astT.stateMutability === "payable");
        }

        const rxInt = /^(u?)int([0-9]*)$/;

        let m = name.match(rxInt);

        if (m !== null) {
            const signed = m[1] !== "u";
            const nBits = m[2] === "" ? 256 : parseInt(m[2]);

            return new IntType(nBits, signed);
        }

        const rxFixedBytes = /^bytes([0-9]+)$/;

        m = name.match(rxFixedBytes);

        if (m !== null) {
            const size = parseInt(m[1]);

            return new FixedBytesType(size);
        }

        if (name === "byte") {
            return new FixedBytesType(1);
        }

        if (name === "bytes") {
            return new BytesType();
        }

        if (name === "string") {
            return new StringType();
        }

        throw new Error(`NYI converting elementary AST Type ${name}`);
    }

    if (astT instanceof ArrayTypeName) {
        const elT = typeNameToTypeNode(astT.vBaseType);

        let size: bigint | undefined;

        if (astT.vLength !== undefined) {
            assert(
                astT.vLength instanceof Literal && astT.vLength.kind == LiteralKind.Number,
                "NYI non-literal array type sizes",
                astT
            );

            size = BigInt(astT.vLength.value);
        }

        return new ArrayType(elT, size);
    }

    if (astT instanceof UserDefinedTypeName) {
        const def = astT.vReferencedDeclaration;

        if (
            def instanceof StructDefinition ||
            def instanceof EnumDefinition ||
            def instanceof ContractDefinition ||
            def instanceof UserDefinedValueTypeDefinition
        ) {
            return new UserDefinedType(getUserDefinedTypeFQName(def), def);
        }

        throw new Error(`NYI typechecking of user-defined type ${def.print()}`);
    }

    if (astT instanceof FunctionTypeName) {
        /**
         * `vType` is always defined here for parameters if a function type.
         * Even in 0.4.x can't have function declarations with `var` args.
         */
        const args = astT.vParameterTypes.vParameters.map(variableDeclarationToTypeNode);
        const rets = astT.vReturnParameterTypes.vParameters.map(variableDeclarationToTypeNode);

        return new FunctionType(undefined, args, rets, astT.visibility, astT.stateMutability);
    }

    if (astT instanceof Mapping) {
        const keyT = typeNameToTypeNode(astT.vKeyType);
        const valueT = typeNameToTypeNode(astT.vValueType);

        return new MappingType(keyT, valueT);
    }

    throw new Error(`NYI converting AST Type ${astT.print()} to SType`);
}

/**
 * Computes a `TypeNode` equivalent of given `astT`,
 * specialized for location `loc` (if applicable).
 */
export function typeNameToSpecializedTypeNode(astT: TypeName, loc: DataLocation): TypeNode {
    return specializeType(typeNameToTypeNode(astT), loc);
}

export function inferVariableDeclLocation(decl: VariableDeclaration): DataLocation {
    if (decl.stateVariable) {
        return DataLocation.Storage;
    } else if (decl.storageLocation !== DataLocation.Default) {
        return decl.storageLocation;
    } else if (
        decl.parent instanceof ParameterList ||
        decl.parent instanceof VariableDeclarationStatement
    ) {
        // In 0.4.x param/return locations may be omitted. We assume memory by default.
        return DataLocation.Memory;
    } else if (decl.parent instanceof StructDefinition) {
        return DataLocation.Default;
    } else if (decl.parent instanceof SourceUnit) {
        // Global vars don't have a location (no ref types yet)
        return DataLocation.Default;
    } else {
        throw new Error(`NYI variable declaration ${pp(decl)}`);
    }
}

/**
 * Given a `VariableDeclaration` node `decl` compute the `TypeNode` that corresponds to the variable.
 * This takes into account the storage location of the `decl`.
 */
export function variableDeclarationToTypeNode(decl: VariableDeclaration): TypeNode {
    assert(decl.vType !== undefined, "Expected {0} to have type", decl);

    const loc: DataLocation = inferVariableDeclLocation(decl);
    return typeNameToSpecializedTypeNode(decl.vType, loc);
}

export function enumToIntType(decl: EnumDefinition): IntType {
    const length = decl.children.length;

    let size: number | undefined;

    for (let n = 8; n <= 32; n += 8) {
        if (length <= 2 ** n) {
            size = n;

            break;
        }
    }

    assert(
        size !== undefined,
        "Unable to detect enum type size - member count exceeds 2 ** 32",
        decl
    );

    return new IntType(size, false);
}

/**
 * Given a set of compiled units and their corresponding compiler version, determine the
 * correct ABIEncoder version for these units. If mulitple incompatible explicit pragmas are found,
 * throw an error.
 */
export function getABIEncoderVersion(
    units: SourceUnit[],
    compilerVersion: string
): ABIEncoderVersion {
    const explicitEncoderVersions = new Set<ABIEncoderVersion>();

    for (const unit of units) {
        for (const nd of unit.getChildrenByType(PragmaDirective)) {
            if (
                nd.vIdentifier === "experimental" &&
                nd.literals.length === 2 &&
                ABIEncoderVersions.has(nd.literals[1])
            ) {
                explicitEncoderVersions.add(nd.literals[1] as ABIEncoderVersion);
            }

            if (nd.vIdentifier === "abicoder") {
                let version: ABIEncoderVersion;
                const rawVer = nd.literals[1];

                if (rawVer === "v1") {
                    version = ABIEncoderVersion.V1;
                } else if (rawVer === "v2") {
                    version = ABIEncoderVersion.V2;
                } else {
                    throw new Error(`Unknown abicoder pragma version ${rawVer}`);
                }

                explicitEncoderVersions.add(version);
            }
        }
    }

    assert(
        explicitEncoderVersions.size < 2,
        `Multiple encoder versions found: ${[...explicitEncoderVersions].join(", ")}`
    );

    if (explicitEncoderVersions.size === 1) {
        return [...explicitEncoderVersions][0];
    }

    return lt(compilerVersion, "0.8.0") ? ABIEncoderVersion.V1 : ABIEncoderVersion.V2;
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

    /// TODO: After eval add case for constant indexing
    return false;
}

export type Value = Decimal | boolean | string;

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

    return new Decimal(expr.value);
}

/// Given a `0b` prefixed (optionally fractional) binary string,
/// return its bitwise negation
function bitwiseNotStr(binStr: string): string {
    const res: string[] = [];
    for (let i = 2; i < binStr.length; i++) {
        res.push(binStr[i] === "." ? "." : binStr[i] === "0" ? "1" : "0");
    }

    return `0b` + res.join("");
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
        if (subVal instanceof Decimal) {
            if (!subVal.isInteger()) {
                throw new EvalError(
                    expr.vSubExpression,
                    `Cannot perform bitwise not on non-int literal ${subVal.toString()}`
                );
            }

            return new Decimal(bitwiseNotStr(subVal.toBinary()));
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

        throw new EvalError(
            expr.vSubExpression,
            `Expected a number in ${pp(expr.vSubExpression)} not ${subVal}`
        );
    }

    throw new Error(`NYI unary operator ${expr.operator}`);
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

    throw new Error(`Unknown equality op ${expr.operator}`);
}

function evalBinaryComparison(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    if (!(lVal instanceof Decimal && rVal instanceof Decimal)) {
        throw new EvalError(expr, `Comparison not allowed for ${lVal} and ${rVal}`);
    }

    if (op === "<") {
        return lVal.lessThan(rVal);
    }

    if (op === "<=") {
        return lVal.lessThanOrEqualTo(rVal);
    }

    if (op === ">") {
        return lVal.greaterThan(rVal);
    }

    if (op === ">=") {
        return lVal.greaterThanOrEqualTo(rVal);
    }

    throw new Error(`Unknown comparison op ${expr.operator}`);
}

function evalBinaryArithmetic(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    const op = expr.operator;

    if (!(lVal instanceof Decimal && rVal instanceof Decimal)) {
        throw new EvalError(expr, `Comparison not allowed for ${lVal} and ${rVal}`);
    }

    if (op === "+") {
        return lVal.plus(rVal);
    }

    if (op === "-") {
        return lVal.minus(rVal);
    }

    if (op === "*") {
        return lVal.times(rVal);
    }

    if (op === "/") {
        return lVal.div(rVal);
    }

    if (op === "%") {
        return lVal.modulo(rVal);
    }

    if (op === "**") {
        return lVal.pow(rVal);
    }

    throw new Error(`Unknown arithmetic op ${expr.operator}`);
}

function evalBinaryBitwise(expr: BinaryOperation, lVal: Value, rVal: Value): Value {
    throw new Error(`NYI Bitwise op ${expr.operator} on ${lVal} ${rVal}`);
}

/// Given a constant `BinaryOperation` expression `expr` evaluate it.
function evalBinary(expr: BinaryOperation): Value {
    const lVal = evalConstantExpr(expr.vLeftExpression);
    const rVal = evalConstantExpr(expr.vRightExpression);

    if (operatorGroups.Logical.includes(expr.operator)) {
        return evalBinaryLogic(expr, lVal, rVal);
    }

    if (operatorGroups.Equality.includes(expr.operator)) {
        return evalBinaryEquality(expr, lVal, rVal);
    }

    if (operatorGroups.Comparison.includes(expr.operator)) {
        return evalBinaryComparison(expr, lVal, rVal);
    }

    if (operatorGroups.Arithmetic.includes(expr.operator)) {
        return evalBinaryArithmetic(expr, lVal, rVal);
    }

    if (operatorGroups.Bitwise.includes(expr.operator)) {
        return evalBinaryBitwise(expr, lVal, rVal);
    }

    throw new Error(`Unknown binary op ${expr.operator}`);
}

/**
 * Given a constant expression `expr` evaluate it to a concrete `Value`. If `expr`
 * is not constant throw `NonConstantExpressionError`.
 *
 * TODO: The order of some operations changed in some version. So perhaps to be fully
 * precise here we will need a compiler version too?
 */
export function evalConstantExpr(expr: Expression): Value {
    if (expr instanceof Literal) {
        return evalLiteral(expr);
    }

    if (expr instanceof UnaryOperation && isConstant(expr.vSubExpression)) {
        return evalUnary(expr);
    }

    if (
        expr instanceof BinaryOperation &&
        isConstant(expr.vLeftExpression) &&
        isConstant(expr.vRightExpression)
    ) {
        return evalBinary(expr);
    }

    /// Note that from the point of view of the type system constant conditionals and
    /// indexing in constant array literals are not considered constant expressions.
    /// So for now we don't support them, but we may change that in the future.
    throw new Error(`${pp(expr)} is not a constant expression.`);
}

export function castable(fromT: TypeNode, toT: TypeNode): boolean {
    if (eq(fromT, toT)) {
        return true;
    }

    if (
        fromT instanceof PointerType &&
        toT instanceof PointerType &&
        eq(fromT.to, toT.to) &&
        toT.location !== DataLocation.CallData
    ) {
        return true;
    }

    if (
        fromT instanceof PointerType &&
        fromT.to instanceof StringType &&
        toT instanceof StringLiteralType
    ) {
        return true;
    }

    if (
        fromT instanceof IntLiteralType &&
        toT instanceof IntType &&
        fromT.literal !== undefined &&
        toT.fits(fromT.literal)
    ) {
        return true;
    }

    return false;
}

export function smallestFittingType(literal: Decimal): IntType | undefined {
    const signed = literal.lessThan(0);
    let nBytes = literal.abs().logarithm(2).div(8).ceil().toNumber();
    nBytes = nBytes === 0 ? 1 : nBytes; // Special case for when literal is 1

    if (nBytes > 32) {
        return undefined;
    }
    return new IntType(nBytes * 8, signed);
}
