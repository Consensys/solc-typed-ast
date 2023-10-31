import { Decimal } from "decimal.js";
import { gte, lt } from "semver";
import {
    ASTNode,
    AnyResolvable,
    ArrayTypeName,
    Assignment,
    BinaryOperation,
    Conditional,
    ContractDefinition,
    ContractKind,
    ElementaryTypeName,
    ElementaryTypeNameExpression,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    Expression,
    ExpressionStatement,
    FunctionCall,
    FunctionCallKind,
    FunctionCallOptions,
    FunctionDefinition,
    FunctionStateMutability,
    FunctionTypeName,
    FunctionVisibility,
    Identifier,
    IdentifierPath,
    ImportDirective,
    IndexAccess,
    IndexRangeAccess,
    Literal,
    LiteralKind,
    Mapping,
    MemberAccess,
    ModifierDefinition,
    NewExpression,
    ParameterList,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    TryCatchClause,
    TupleExpression,
    TypeName,
    UnaryOperation,
    UserDefinedTypeName,
    UserDefinedValueTypeDefinition,
    VariableDeclaration,
    VariableDeclarationStatement,
    encodeEventSignature,
    encodeFuncSignature,
    resolveAny
} from "../ast";
import { DataLocation, ExternalReferenceType } from "../ast/constants";
import { assert, eq, forAll, forAny, pp } from "../misc";
import { ABIEncoderVersion, abiTypeToCanonicalName, abiTypeToLibraryCanonicalName } from "./abi";
import {
    AddressType,
    ArrayType,
    BoolType,
    BuiltinFunctionType,
    BuiltinStructType,
    BytesType,
    ErrorType,
    EventType,
    FixedBytesType,
    FunctionLikeSetType,
    FunctionType,
    ImportRefType,
    IntLiteralType,
    IntType,
    MappingType,
    ModifierType,
    NumericLiteralType,
    PackedArrayType,
    PointerType,
    RationalLiteralType,
    StringLiteralType,
    StringType,
    SuperType,
    TupleType,
    TypeNameType,
    TypeNode,
    TypeNodeConstructor,
    UserDefinedType
} from "./ast";
import {
    address06Builtins,
    address06PayableBuiltins,
    addressBuiltins,
    globalBuiltins,
    typeContract,
    typeInt,
    typeInterface
} from "./builtins";
import { evalConstantExpr } from "./eval_const";
import { SolTypeError } from "./misc";
import { TypeSubstituion, applySubstitution, buildSubstitutions } from "./polymorphic";
import { types } from "./reserved";
import {
    BINARY_OPERATOR_GROUPS,
    CALL_BUILTINS,
    SUBDENOMINATION_MULTIPLIERS,
    castable,
    decimalToRational,
    enumToIntType,
    generalizeType,
    getABIEncoderVersion,
    getFQDefName,
    getFallbackRecvFuns,
    inferCommonVisiblity,
    isReferenceType,
    isVisiblityExternallyCallable,
    mergeFunTypes,
    smallestFittingType,
    specializeType,
    stripSingletonParens
} from "./utils";

const unaryImpureOperators = ["++", "--"];

const RX_ADDRESS = /^address *(payable)?$/;
const RX_INTEGER = /^(u?)int([0-9]*)$/;
const RX_FIXED_BYTES = /^bytes([0-9]+)$/;

/**
 * Some builtins have types that are not easy to express with our current hacky polymorphic support.
 * For those we have the custom type constructors before, that introspect the AST to determine the type.
 */
export const builtinTypes: { [key: string]: (arg: ASTNode) => TypeNode } = {
    revert: (arg: ASTNode) => {
        const hasMsg = arg.parent instanceof FunctionCall && arg.parent.vArguments.length === 1;
        const argTs = hasMsg ? [types.stringMemory] : [];

        return new BuiltinFunctionType("revert", argTs, []);
    },

    require: (arg: ASTNode) => {
        const hasMsg = arg.parent instanceof FunctionCall && arg.parent.vArguments.length === 2;
        const argTs = hasMsg ? [types.bool, types.stringMemory] : [types.bool];

        return new BuiltinFunctionType("require", argTs, []);
    },

    this: (node) => {
        const contract = node.getClosestParentByType(ContractDefinition);

        assert(contract !== undefined, "this ({0}) used outside of a contract", node);

        return new UserDefinedType(contract.name, contract);
    }
};

function typesAreUnordered<T1 extends TypeNode, T2 extends TypeNode>(
    a: TypeNode,
    b: TypeNode,
    T1Const: TypeNodeConstructor<T1>,
    T2Const: TypeNodeConstructor<T2>
): [T1, T2] | [undefined, undefined] {
    if (a instanceof T1Const && b instanceof T2Const) {
        return [a, b];
    }

    if (b instanceof T1Const && a instanceof T2Const) {
        return [b, a];
    }

    return [undefined, undefined];
}

/**
 * Given a `FunctionType` or `FunctionSetType` `arg` return a new `FunctionType`/`FunctionSetType` with
 * all first arguments marked as implicit.
 */
function markFirstArgImplicit<T extends FunctionType | FunctionLikeSetType<FunctionType>>(
    arg: T
): T {
    if (arg instanceof FunctionType) {
        return new FunctionType(
            arg.name,
            arg.parameters,
            arg.returns,
            arg.visibility,
            arg.mutability,
            true,
            arg.src
        ) as T;
    }

    return new FunctionLikeSetType(arg.defs.map(markFirstArgImplicit)) as T;
}

function isSupportedByEncoderV1(type: TypeNode): boolean {
    if (type instanceof PointerType) {
        return isSupportedByEncoderV1(type.to);
    }

    if (type instanceof UserDefinedType && type.definition instanceof StructDefinition) {
        return false;
    }

    if (type instanceof ArrayType) {
        const [baseT] = generalizeType(type.elementT);

        return (
            isSupportedByEncoderV1(baseT) &&
            !(baseT instanceof ArrayType && baseT.size === undefined)
        );
    }

    return true;
}

export class InferType {
    constructor(public readonly version: string) {}

    /**
     * Infer the type of the assignment `node`. (In solidity assignments are expressions)
     */
    typeOfAssignment(node: Assignment): TypeNode {
        const lhs = stripSingletonParens(node.vLeftHandSide);

        if (lhs instanceof TupleExpression) {
            // For tuple assignments some part of the LHS may be omitted. We still need to compute a type for them those
            // due to nested assignments. E.g. in `(a, b) = (c, ) = ("foo", true))` we still need to compute a type for the
            // second field in the inner tuple assignment, even though there is LHS there.
            const rhsT = this.typeOf(node.vRightHandSide);

            assert(
                rhsT instanceof TupleType,
                "Unexpected non-tuple in rhs of tuple assignment {0}",
                node
            );

            const comps = lhs.vOriginalComponents;

            // Its possible to do assignments (a, b,) = fun() where fun returns more than 3 elements.
            assert(
                rhsT.elements.length >= comps.length,
                `Unexpected more lhs tuple elements (${comps.length}) than rhs tuple elements (${rhsT.elements.length}) in {0}`,
                node
            );

            const resTs: Array<TypeNode | null> = [];

            for (let i = 0; i < comps.length; i++) {
                const lhsComp = comps[i];

                resTs.push(lhsComp === null ? rhsT.elements[i] : this.typeOf(lhsComp));
            }

            return new TupleType(resTs);
        }

        return this.typeOf(lhs);
    }

    /**
     * Given to numeric expressions infer a common type to which they can both be implicitly casted.
     */
    inferCommonIntType(
        a: IntType | IntLiteralType,
        b: IntType | IntLiteralType
    ): IntType | IntLiteralType {
        // If both are literals evaluate the expression
        if (a instanceof IntLiteralType && b instanceof IntLiteralType) {
            assert(
                a.literal !== undefined && b.literal !== undefined,
                "Unexpected missing literals"
            );

            const res = smallestFittingType(a.literal, b.literal);

            assert(res !== undefined, "Couldn't find concrete types for {0} and {1}", a, b);

            return res;
        }

        // If one of them is an int literal, and the other is not, we have 2 cases
        // 1) The literal fits in the int type - take the int type
        // 2) The literal doesn't fit in the int type - widen the int type.
        if (a instanceof IntLiteralType || b instanceof IntLiteralType) {
            const [literalT, concreteT] = typesAreUnordered(a, b, IntLiteralType, IntType) as [
                IntLiteralType,
                IntType
            ];

            assert(literalT.literal !== undefined, "TODO: Remove when we remove typestring parser");

            const decMin = concreteT.min();
            const decMax = concreteT.max();

            /// Literal less than the minimum for the concrete type
            if (decMin > literalT.literal) {
                return this.inferCommonIntType(
                    new IntLiteralType(literalT.literal),
                    new IntLiteralType(decMax)
                );
            }

            if (decMax < literalT.literal) {
                return this.inferCommonIntType(
                    new IntLiteralType(decMin),
                    new IntLiteralType(literalT.literal)
                );
            }

            /// Literal fits
            return concreteT;
        }

        // Otherwise find a common type to which they cast
        if (a.signed === b.signed) {
            return new IntType(Math.max(a.nBits, b.nBits), a.signed);
        }

        const unsigned = a.signed ? b : a;
        const signed = a.signed ? a : b;

        // Prior to 0.8.1 you could implicitly cast uintN to intM if M > N
        if (lt(this.version, "0.8.1") && signed.nBits > unsigned.nBits) {
            return new IntType(signed.nBits, true);
        }

        throw new SolTypeError(`Can't figure out a common type for ${pp(a)} and ${pp(b)}`);
    }

    /**
     * Given two types `a` and `b` infer the common type that they are both
     * implicitly casted to, when appearing in a binary op/conditional.
     * Its currently usually `a` or `b`
     */
    inferCommonType(a: TypeNode, b: TypeNode): TypeNode {
        /**
         * The common type for two string literals is string memory.
         * For example the type of `flag ? "a" : "b"` is string memory,
         * not string literal.
         *
         * @todo This edge case is ugly. It suggests that perhaps we should
         * remove StringLiteralType from the type system.
         */
        if (a instanceof StringLiteralType && b instanceof StringLiteralType) {
            return types.stringMemory;
        }

        if (eq(a, b)) {
            return a;
        }

        if (
            (a instanceof IntType || a instanceof IntLiteralType) &&
            (b instanceof IntType || b instanceof IntLiteralType)
        ) {
            return this.inferCommonIntType(a, b);
        }

        if (
            a instanceof PointerType &&
            b instanceof PointerType &&
            eq(a.to, b.to) &&
            a.location !== b.location
        ) {
            return new PointerType(a.to, DataLocation.Memory);
        }

        const [stringLitT, stringT] = typesAreUnordered(a, b, StringLiteralType, PointerType);

        // Note: Can't rely on implicit casting here as the common type for "abcd" and string storage is string memory.
        if (stringT !== undefined && stringLitT !== undefined && stringT.to instanceof StringType) {
            return this.inferCommonType(stringT, types.stringMemory);
        }

        if (
            a instanceof TupleType &&
            b instanceof TupleType &&
            a.elements.length === b.elements.length
        ) {
            const commonElTs: Array<TypeNode | null> = [];

            for (let i = 0; i < a.elements.length; i++) {
                const aElT = a.elements[i];
                const bElT = b.elements[i];

                let commonElT: TypeNode | null;

                if (aElT !== null && bElT !== null) {
                    commonElT = this.inferCommonType(aElT, bElT);

                    if (commonElT instanceof IntLiteralType && commonElT.literal !== undefined) {
                        const fittingT = smallestFittingType(commonElT.literal);

                        assert(
                            fittingT !== undefined,
                            "Can't infer common type for tuple elements {0} between {1} and {2}",
                            i,
                            a,
                            b
                        );

                        commonElT = fittingT;
                    }
                } else {
                    commonElT = aElT ?? bElT;
                }

                commonElTs.push(commonElT);
            }

            return new TupleType(commonElTs);
        }

        const [fun, funSet] = typesAreUnordered(a, b, FunctionType, FunctionLikeSetType);

        if (fun && funSet) {
            for (const funT of funSet.defs) {
                if (
                    funT instanceof FunctionType &&
                    eq(new TupleType(fun.parameters), new TupleType(funT.parameters)) &&
                    eq(new TupleType(fun.returns), new TupleType(funT.returns)) &&
                    (fun.visibility === FunctionVisibility.External) ===
                        (funT.visibility === FunctionVisibility.External)
                ) {
                    return fun;
                }
            }
        }

        if (
            a instanceof FunctionType &&
            b instanceof FunctionType &&
            eq(new TupleType(a.parameters), new TupleType(b.parameters)) &&
            eq(new TupleType(a.returns), new TupleType(b.returns)) &&
            a.mutability === b.mutability
        ) {
            const commonVis = inferCommonVisiblity(a.visibility, b.visibility);

            if (commonVis) {
                return new FunctionType(
                    undefined,
                    a.parameters,
                    a.returns,
                    commonVis,
                    a.mutability
                );
            }
        }

        // a implicitly castable to b - return b
        if (castable(a, b, this.version)) {
            return b;
        }

        // b implicitly castable to a - return a
        if (castable(b, a, this.version)) {
            return a;
        }

        throw new SolTypeError(`Cannot infer commmon type for ${pp(a)} and ${pp(b)}`);
    }

    typeOfCustomizableOperation(node: UnaryOperation | BinaryOperation): TypeNode | undefined {
        const userFunction = node.vUserFunction;

        if (userFunction === undefined) {
            return undefined;
        }

        const funType = this.funDefToType(userFunction);

        assert(
            funType.returns.length === 1,
            "Expected {0} type of {1} to have a single return value for operation {2}",
            funType,
            userFunction,
            node
        );

        return funType.returns[0];
    }

    /**
     * Infer the type of the binary op
     */
    typeOfBinaryOperation(node: BinaryOperation): TypeNode {
        const customType = this.typeOfCustomizableOperation(node);

        if (customType) {
            return customType;
        }

        if (
            BINARY_OPERATOR_GROUPS.Comparison.includes(node.operator) ||
            BINARY_OPERATOR_GROUPS.Equality.includes(node.operator) ||
            BINARY_OPERATOR_GROUPS.Logical.includes(node.operator)
        ) {
            return types.bool;
        }

        const a = this.typeOf(node.vLeftExpression);
        const b = this.typeOf(node.vRightExpression);

        if (a instanceof NumericLiteralType && b instanceof NumericLiteralType) {
            const res = evalConstantExpr(node, this);

            assert(
                res instanceof Decimal || typeof res === "bigint",
                "Unexpected result of const binary op"
            );

            return typeof res === "bigint"
                ? new IntLiteralType(res)
                : new RationalLiteralType(decimalToRational(res));
        }

        // After 0.6.0 the type of ** is just the type of the lhs
        // Between 0.6.0 and 0.7.0 if the lhs is an int literal type it
        // took the type of the rhs if it wasn't a literal type. After 0.7.0 it
        // just assumes uint256.
        if (node.operator === "**") {
            if (gte(this.version, "0.7.0")) {
                return a instanceof IntLiteralType ? types.uint256 : a;
            }

            if (gte(this.version, "0.6.0")) {
                if (a instanceof IntLiteralType) {
                    return b instanceof IntType ? b : types.uint256;
                }

                return a;
            }
        }

        if (BINARY_OPERATOR_GROUPS.Arithmetic.includes(node.operator)) {
            assert(
                a instanceof IntType || a instanceof IntLiteralType,
                "Unexpected type of {0}",
                a
            );

            assert(
                b instanceof IntType || b instanceof IntLiteralType,
                "Unexpected type of {0}",
                b
            );

            return this.inferCommonIntType(a, b);
        }

        if (BINARY_OPERATOR_GROUPS.Bitwise.includes(node.operator)) {
            // For bitshifts just take the type of the lhs
            if ([">>", "<<"].includes(node.operator)) {
                if (a instanceof IntLiteralType) {
                    return gte(this.version, "0.7.0") ? types.uint256 : b;
                }

                return a;
            }

            // For all other bitwise operators infer a common type. In earlier versions it wa allowed
            // to have bitwise ops between differing sizes
            return this.inferCommonType(a, b);
        }

        throw new Error(`NYI Binary op ${node.operator}`);
    }

    /**
     * Infer the type of the conditional expression
     */
    typeOfConditional(node: Conditional): TypeNode {
        const trueT = this.typeOf(node.vTrueExpression);
        const falseT = this.typeOf(node.vFalseExpression);

        return this.inferCommonType(trueT, falseT);
    }

    /**
     * Infer the type of a struct constructor expression
     */
    typeOfStructConstructorCall(node: FunctionCall): TypeNode {
        const callee = node.vCallee;

        assert(
            callee instanceof Identifier ||
                callee instanceof IdentifierPath ||
                callee instanceof MemberAccess,
            `Unexpected node in Struct construction call ${callee.constructor.name}`,
            callee
        );

        const calleeT = this.typeOf(callee);

        assert(
            calleeT instanceof TypeNameType &&
                calleeT.type instanceof UserDefinedType &&
                calleeT.type.definition instanceof StructDefinition,
            "Unexpected callee type {0}",
            calleeT
        );

        return new PointerType(calleeT.type, DataLocation.Memory, "ref");
    }

    /**
     * Casts to address (address(0x...) or address(<some contract>)) have some edge cases
     * due to the introduction of 'payable' in 0.5.0.
     * In solc >=0.5.0 an address cast returns payable if
     *  1. The address is a constant
     *  2. The cast is from a contract that has a payable fallback or receive function
     *  (see https://docs.soliditylang.org/en/latest/050-breaking-changes.html#explicitness-requirements)
     * However sometimes in the AST the payability of the cast differs from the payability of the
     * elementary typename itself. We fix up the payability of the fun call here.
     */
    private typeOfAddressCast(node: FunctionCall, calleeT: AddressType): TypeNode {
        // In solc <0.5.0 there is no address payable
        if (lt(this.version, "0.5.0")) {
            return calleeT;
        }

        if (calleeT.payable) {
            return calleeT;
        }

        // After 0.8.0 all explicit casts to address are non-payable
        if (gte(this.version, "0.8.0")) {
            return calleeT;
        }

        assert(node.vArguments.length === 1, `Unexpected number of args to type cast {0}`, node);

        const arg = node.vArguments[0];

        if (arg instanceof Literal && arg.value.startsWith("0x") && arg.value.length === 42) {
            return lt(this.version, "0.6.0") ? types.addressPayable : types.address;
        }

        const argT = this.typeOf(arg);

        if (
            argT instanceof IntType ||
            argT instanceof IntLiteralType ||
            argT instanceof FixedBytesType
        ) {
            return types.addressPayable;
        }

        if (argT instanceof AddressType && lt(this.version, "0.6.0")) {
            return argT;
        }

        if (argT instanceof UserDefinedType && argT.definition instanceof ContractDefinition) {
            if (
                forAny(
                    getFallbackRecvFuns(argT.definition),
                    (fn) => fn.stateMutability === FunctionStateMutability.Payable
                )
            ) {
                return types.addressPayable;
            }
        }

        return calleeT;
    }

    /**
     * Infer the type of a type cast
     */
    typeOfTypeConversion(node: FunctionCall): TypeNode {
        const callee = node.vCallee;

        assert(
            callee instanceof TupleExpression ||
                callee instanceof ElementaryTypeNameExpression ||
                callee instanceof Identifier ||
                callee instanceof IdentifierPath ||
                callee instanceof MemberAccess ||
                callee instanceof IndexAccess,
            `Unexpected node in type convertion call ${callee.constructor.name}`,
            callee
        );

        const calleeT = this.typeOf(callee);

        if (!(calleeT instanceof TypeNameType)) {
            throw new SolTypeError(`Unexpected base type in type cast ${pp(calleeT)}`);
        }

        if (calleeT.type instanceof AddressType) {
            return this.typeOfAddressCast(node, calleeT.type);
        }

        const innerT = this.typeOf(node.vArguments[0]);
        const loc = innerT instanceof PointerType ? innerT.location : DataLocation.Memory;

        return specializeType(calleeT.type, loc);
    }

    /**
     * Infer the type of a call with a `new` expression as callee
     */
    typeOfNewCall(node: FunctionCall): TypeNode {
        const newExpr = node.vCallee;

        assert(newExpr instanceof NewExpression, 'Unexpected "new" call {0}', newExpr);

        const typ = this.typeNameToTypeNode(newExpr.vTypeName);
        const loc =
            typ instanceof UserDefinedType && typ.definition instanceof ContractDefinition
                ? DataLocation.Storage
                : DataLocation.Memory;

        return specializeType(typ, loc);
    }

    private matchArguments(
        funs: Array<FunctionType | BuiltinFunctionType>,
        callsite: FunctionCall
    ): FunctionType | BuiltinFunctionType | undefined {
        const args = callsite.vArguments;
        const callExp = callsite.vExpression;

        const argTs: TypeNode[] = args.map((arg) => this.typeOf(arg));

        const argTsWithImplictArg =
            callExp instanceof MemberAccess ? [this.typeOf(callExp.vExpression), ...argTs] : argTs;

        for (let funT of funs) {
            if (funT instanceof BuiltinFunctionType) {
                funT = this.specializeBuiltinTypeToCall(callsite, funT);
            }

            const actualTs =
                funT instanceof FunctionType && funT.implicitFirstArg ? argTsWithImplictArg : argTs;

            if (funT.parameters.length !== actualTs.length) {
                continue;
            }

            let argsMatch = true;

            for (let i = 0; i < funT.parameters.length; i++) {
                argsMatch = castable(actualTs[i], funT.parameters[i], this.version);

                if (!argsMatch) {
                    break;
                }
            }

            if (argsMatch) {
                return funT;
            }
        }

        return undefined;
    }

    /**
     * Given a `BuiltunFunctionType` `calleeT` and an actual
     * callsite `node` where it is invoked, specialize `calleeT` to the callsite.
     * Specifically, if `calleeT` is polymorphic (i.e. has a TRest or TVar) substitute
     * those with the types of the actual arguments.
     */
    private specializeBuiltinTypeToCall(
        node: FunctionCall,
        calleeT: BuiltinFunctionType
    ): BuiltinFunctionType {
        const argTs = node.vArguments.map((arg) => this.typeOf(arg));
        const m: TypeSubstituion = new Map();

        /**
         * We can push fixed sized arrays (e.g. uint[1]) to storage arrays of arrays (uint[][]).
         * Add this implicit cast here
         */
        if (
            calleeT instanceof BuiltinFunctionType &&
            node.vFunctionName === "push" &&
            !eq(calleeT.parameters[0], argTs[0]) &&
            castable(argTs[0], calleeT.parameters[0], this.version)
        ) {
            argTs[0] = calleeT.parameters[0];
        }

        buildSubstitutions(calleeT.parameters, argTs, m, this.version);

        return applySubstitution(calleeT, m) as BuiltinFunctionType;
    }

    /**
     * Infer the type of the function call
     */
    typeOfFunctionCall(node: FunctionCall): TypeNode {
        if (node.kind === FunctionCallKind.StructConstructorCall) {
            return this.typeOfStructConstructorCall(node);
        }

        if (node.kind === FunctionCallKind.TypeConversion) {
            return this.typeOfTypeConversion(node);
        }

        if (node.vCallee instanceof NewExpression) {
            return this.typeOfNewCall(node);
        }

        const resolvedCalleeT = this.typeOfCallee(node);

        let rets: TypeNode[];

        if (resolvedCalleeT instanceof FunctionType) {
            rets = resolvedCalleeT.returns;

            // Convert any calldata pointers back to memory for external calls
            if (node.vExpression instanceof MemberAccess) {
                rets = rets.map((retT) =>
                    retT instanceof PointerType && retT.location === DataLocation.CallData
                        ? specializeType(generalizeType(retT)[0], DataLocation.Memory)
                        : retT
                );
            }
        } else if (resolvedCalleeT instanceof BuiltinFunctionType) {
            rets = resolvedCalleeT.returns;
        } else if (resolvedCalleeT instanceof EventType || resolvedCalleeT instanceof ErrorType) {
            rets = [];
        } else {
            throw new SolTypeError(
                `Unexpected unresolved calele type in function call ${pp(node)}`
            );
        }

        // No returns - return the empty type ()
        if (rets.length === 0) {
            return types.noType;
        }

        if (rets.length === 1) {
            return rets[0];
        }

        return new TupleType(rets);
    }

    typeOfIndexAccess(node: IndexAccess): TypeNode {
        const baseT = this.typeOf(node.vBaseExpression);

        if (baseT instanceof FixedBytesType) {
            return types.byte;
        }

        if (baseT instanceof PointerType) {
            const toT = baseT.to;

            if (toT instanceof ArrayType) {
                return toT.elementT;
            }

            if (toT instanceof MappingType) {
                return toT.valueType;
            }

            if (toT instanceof BytesType) {
                return types.byte;
            }
        }

        /// Array index in an elementary type-name expression (e.g. new Contract[](4))
        if (baseT instanceof TypeNameType) {
            const size =
                node.vIndexExpression &&
                node.vIndexExpression instanceof Literal &&
                node.vIndexExpression.kind === LiteralKind.Number
                    ? BigInt(node.vIndexExpression.value)
                    : undefined;

            return new TypeNameType(new ArrayType(baseT.type, size));
        }

        throw new SolTypeError(`Cannot index into type ${pp(baseT)} in ${pp(node)}`);
    }

    typeOfIndexRangeAccess(node: IndexRangeAccess): TypeNode {
        const baseT = this.typeOf(node.vBaseExpression);

        if (
            !(
                baseT instanceof PointerType &&
                baseT.to instanceof BytesType &&
                baseT.location === DataLocation.CallData
            )
        ) {
            throw new SolTypeError(`Unexpected base type ${pp(baseT)} in slice ${pp(node)}`);
        }

        /**
         * @todo (dimo): This typing is not precise. We should add a special slice type as described
         * in the documentation here https://docs.soliditylang.org/en/latest/types.html#array-slices
         */
        return baseT;
    }

    /**
     * Infer the type of the builtin 'type' keyword. This is a function from a
     * type name to a struct with fields that depend on whether the argument is
     * a contract, interface, or numeric type. See
     * https://docs.soliditylang.org/en/v0.6.10/units-and-global-variables.html
     * for details.
     */
    typeOfBuiltinType(node: Identifier): TypeNode {
        assert(
            node.parent instanceof FunctionCall && node.parent.vArguments.length === 1,
            "Unexpected use of builtin type {0}",
            node
        );

        const typeOfArg = this.typeOf(node.parent.vArguments[0]);

        if (!(typeOfArg instanceof TypeNameType)) {
            throw new SolTypeError(
                `Unexpected argument to type() ${pp(node.parent.vArguments[0])}`
            );
        }

        const innerT = typeOfArg.type;

        if (
            innerT instanceof IntType ||
            (innerT instanceof UserDefinedType && innerT.definition instanceof EnumDefinition)
        ) {
            return applySubstitution(typeInt, new Map([["T", innerT]]));
        }

        if (innerT instanceof UserDefinedType && innerT.definition instanceof ContractDefinition) {
            const resTemplateT =
                innerT.definition.kind === ContractKind.Interface || innerT.definition.abstract
                    ? typeInterface
                    : typeContract;

            return applySubstitution(resTemplateT, new Map([["T", innerT]]));
        }

        throw new SolTypeError(`Unexpected type ${innerT.pp()} in type() node ${pp(node)}`);
    }

    /**
     * Infer the type of a builtin identifier `node`.
     */
    typeOfBuiltin(node: Identifier): TypeNode {
        if (node.name === "type") {
            return this.typeOfBuiltinType(node);
        }

        if (node.name === "super") {
            const contract = node.getClosestParentByType(ContractDefinition);

            assert(contract !== undefined, "Use of super outside of contract in {0}", node);

            return new SuperType(contract);
        }

        const globalBuiltin = globalBuiltins.getFieldForVersion(node.name, this.version);

        if (globalBuiltin) {
            return globalBuiltin;
        }

        assert(node.name in builtinTypes, 'NYI builtin "{0}" for {1}', node.name, node);

        return builtinTypes[node.name](node);
    }

    private getRHSTypeForDecl(
        decl: VariableDeclaration,
        stmt: VariableDeclarationStatement
    ): TypeNode | undefined {
        if (stmt.vInitialValue === undefined) {
            return undefined;
        }

        const rhsT = this.typeOf(stmt.vInitialValue);

        if (rhsT instanceof TupleType && stmt.assignments.length > 0) {
            const tupleIdx = stmt.assignments.indexOf(decl.id);

            assert(tupleIdx > -1, "Var decl {0} not found in assignments of {1}", decl, stmt);

            assert(rhsT.elements.length > tupleIdx, "Rhs not a tuple of right size in {0}", stmt);

            const rhsElT = rhsT.elements[tupleIdx];

            return rhsElT !== null ? rhsElT : undefined;
        }

        return rhsT;
    }

    /**
     * Infer the type of the identifier
     */
    typeOfIdentifier(node: Identifier): TypeNode {
        const def = node.vReferencedDeclaration;

        if (def === undefined) {
            // Identifiers in import definitions (e.g. the `a` in `import a from
            // "foo.sol"` also have undefined vReferencedDeclaration and look
            // like builtins. Disambiguate them here.
            if (node.parent instanceof ImportDirective) {
                const imp = node.parent;

                // Sanity check that vSymbolAliases were built correctly
                assert(
                    node.parent.symbolAliases.length === node.parent.vSymbolAliases.length,
                    `Unexpected import directive with missing symbolic aliases {0}`,
                    node.parent
                );

                for (let i = 0; i < imp.symbolAliases.length; i++) {
                    const alias = imp.symbolAliases[i];

                    if (!(alias.foreign instanceof Identifier && alias.foreign.id === node.id)) {
                        continue;
                    }

                    const originalSym = imp.vSymbolAliases[i][0];

                    if (
                        originalSym instanceof ContractDefinition ||
                        originalSym instanceof StructDefinition ||
                        originalSym instanceof EnumDefinition ||
                        originalSym instanceof UserDefinedValueTypeDefinition
                    ) {
                        return new TypeNameType(
                            new UserDefinedType(getFQDefName(originalSym), originalSym)
                        );
                    }

                    if (originalSym instanceof ImportDirective) {
                        return new ImportRefType(originalSym);
                    }

                    if (originalSym instanceof ErrorDefinition) {
                        return this.errDefToType(originalSym);
                    }

                    if (originalSym instanceof FunctionDefinition) {
                        return this.funDefToType(originalSym);
                    }

                    if (originalSym instanceof EventDefinition) {
                        return this.eventDefToType(originalSym);
                    }

                    return this.variableDeclarationToTypeNode(originalSym);
                }
            }

            // If not an imported identifier must be a builtin
            return this.typeOfBuiltin(node);
        }

        if (def instanceof VariableDeclaration) {
            if (!def.vType && def.parent instanceof VariableDeclarationStatement) {
                /// In 0.4.x the TypeName on variable declarations may be omitted. Attempt to infer it from the RHS (if any)
                const varDeclStmt = def.parent;
                let defInitT = this.getRHSTypeForDecl(def, varDeclStmt);

                assert(
                    defInitT !== undefined,
                    "Initializer required when no type specified in {0}",
                    varDeclStmt
                );

                if (defInitT instanceof IntLiteralType) {
                    const concreteT = defInitT.smallestFittingType();

                    assert(
                        concreteT !== undefined,
                        "RHS int literal type {0} doesn't fit in an int type",
                        defInitT
                    );

                    defInitT = concreteT;
                }

                if (defInitT instanceof StringLiteralType) {
                    return types.stringMemory;
                }

                return defInitT;
            }

            return this.variableDeclarationToTypeNode(def);
        }

        if (
            def instanceof StructDefinition ||
            def instanceof ContractDefinition ||
            def instanceof EnumDefinition
        ) {
            const fqName = getFQDefName(def);

            return new TypeNameType(new UserDefinedType(fqName, def));
        }

        if (def instanceof EventDefinition) {
            const argTs = def.vParameters.vParameters.map((arg) =>
                this.variableDeclarationToTypeNode(arg)
            );

            return new EventType(def.name, argTs);
        }

        if (def instanceof ModifierDefinition) {
            const argTs = def.vParameters.vParameters.map((arg) =>
                this.variableDeclarationToTypeNode(arg)
            );

            return new ModifierType(def.name, argTs);
        }

        if (def instanceof FunctionDefinition) {
            return this.funDefToType(def);
        }

        if (def instanceof ImportDirective) {
            return new ImportRefType(def);
        }

        if (def instanceof ErrorDefinition) {
            return this.errDefToType(def);
        }

        if (def instanceof UserDefinedValueTypeDefinition) {
            return new TypeNameType(new UserDefinedType(getFQDefName(def), def));
        }

        throw new Error(
            `NYI infer of identifier ${node.name} (${pp(node)}) with def ${def.constructor.name}`
        );
    }

    typeOfLiteral(node: Literal): TypeNode {
        if (node.kind === LiteralKind.Number) {
            if (node.typeString === "address") {
                return types.address;
            }

            if (node.typeString === "address payable") {
                return types.addressPayable;
            }

            let val = new Decimal(node.value.replaceAll("_", ""));

            if (node.subdenomination !== undefined) {
                const multiplier = SUBDENOMINATION_MULTIPLIERS.get(node.subdenomination);

                assert(
                    multiplier !== undefined,
                    "Unknown subdenomination {0}",
                    node.subdenomination
                );

                val = val.times(multiplier);
            }

            if (val.isInteger()) {
                return new IntLiteralType(BigInt(val.toFixed()));
            }

            return new RationalLiteralType(decimalToRational(val));
        }

        if (
            node.kind === LiteralKind.String ||
            node.kind === LiteralKind.UnicodeString ||
            node.kind === LiteralKind.HexString
        ) {
            return new StringLiteralType(node.kind);
        }

        assert(node.kind === LiteralKind.Bool, "Unexpected literal kind {0}", node.kind);

        return types.bool;
    }

    /**
     * If the `MemberAccess` corresponds to a library function
     * bound with a `using for` directive, return the type of that function.
     */
    private typeOfMemberAccessUsingFor(node: MemberAccess, baseT: TypeNode): TypeNode | undefined {
        if (baseT instanceof TypeNameType) {
            return undefined;
        }

        const containingContract = node.getClosestParentByType(ContractDefinition);

        if (containingContract) {
            let matchedFuns = new FunctionLikeSetType<BuiltinFunctionType | FunctionType>([]);

            for (const base of containingContract.vLinearizedBaseContracts) {
                for (const usingFor of base.vUsingForDirectives) {
                    let match = false;

                    if (usingFor.vTypeName === undefined) {
                        /// using for *;
                        match = true;
                    } else {
                        const usingForTyp = this.typeNameToTypeNode(usingFor.vTypeName);

                        match = eq(usingForTyp, generalizeType(baseT)[0]);
                    }

                    if (!match) {
                        continue;
                    }

                    if (usingFor.vFunctionList) {
                        for (const entry of usingFor.vFunctionList) {
                            if (entry instanceof IdentifierPath && entry.name === node.memberName) {
                                const funDef = entry.vReferencedDeclaration;

                                assert(
                                    funDef instanceof FunctionDefinition,
                                    "Unexpected non-function decl {0} for name {1} in using for {2}",
                                    funDef,
                                    entry.name,
                                    usingFor
                                );

                                matchedFuns = mergeFunTypes(
                                    matchedFuns,
                                    this.funDefToType(funDef, true)
                                );
                            }
                        }
                    }

                    if (usingFor.vLibraryName) {
                        const lib = usingFor.vLibraryName.vReferencedDeclaration;

                        assert(
                            lib instanceof ContractDefinition,
                            "Unexpected non-library decl {0} for name {1} in using for {2}",
                            lib,
                            usingFor.vLibraryName.name,
                            usingFor
                        );

                        const res = this.typeOfResolved(node.memberName, lib, false);

                        if (res) {
                            assert(
                                res instanceof FunctionType || res instanceof FunctionLikeSetType,
                                "Unexpected type {0} for {1} in library {1}",
                                res,
                                node.memberName,
                                usingFor.vLibraryName.name
                            );

                            matchedFuns = mergeFunTypes(matchedFuns, markFirstArgImplicit(res));
                        }
                    }
                }
            }

            if (matchedFuns.defs.length === 1) {
                return matchedFuns.defs[0];
            }

            if (matchedFuns.defs.length > 1) {
                return matchedFuns;
            }
        }

        return undefined;
    }

    /**
     * If the `MemberAccess` corresponds to a external function or a getter invoked on a contract
     * return the type of the function/getter.
     */
    typeOfMemberAccess(node: MemberAccess): TypeNode {
        const baseT = this.typeOf(node.vExpression);
        const usingForT = this.typeOfMemberAccessUsingFor(node, baseT);
        const normalT = this.typeOfMemberAccessImpl(node, baseT);

        if (usingForT !== undefined) {
            if (normalT === undefined) {
                return usingForT;
            }

            if (
                normalT instanceof FunctionType ||
                normalT instanceof FunctionLikeSetType ||
                normalT instanceof BuiltinFunctionType
            ) {
                assert(
                    usingForT instanceof FunctionType || usingForT instanceof FunctionLikeSetType,
                    "Expection function-like type for using-for, not {0}",
                    usingForT
                );

                return mergeFunTypes(usingForT, normalT);
            }
        }

        assert(
            normalT !== undefined,
            "Unknown field {0} on {1} of type {2}",
            node.memberName,
            node,
            baseT
        );

        return normalT;
    }

    private typeOfMemberAccessImpl(node: MemberAccess, baseT: TypeNode): TypeNode | undefined {
        if (baseT instanceof UserDefinedType && baseT.definition instanceof ContractDefinition) {
            const contract = baseT.definition;

            const fieldT = this.typeOfResolved(node.memberName, contract, true);

            assert(
                fieldT === undefined ||
                    fieldT instanceof FunctionType ||
                    fieldT instanceof FunctionLikeSetType,
                "External field lookup for {0} on contract must be a function, not {1}",
                node.memberName,
                fieldT
            );

            let builtinT: TypeNode | undefined;

            // For solidity <0.5.0 contract variables are implicitly castable to address
            if (lt(this.version, "0.5.0")) {
                builtinT = addressBuiltins.getFieldForVersion(node.memberName, this.version);
            }

            if (fieldT) {
                if (builtinT instanceof BuiltinFunctionType) {
                    return mergeFunTypes(
                        fieldT as FunctionType | FunctionLikeSetType<FunctionType>,
                        builtinT
                    );
                }

                return fieldT;
            }

            if (builtinT) {
                return builtinT;
            }
        }

        if (baseT instanceof PointerType) {
            const toT = baseT.to;

            /// Fields of structs
            if (toT instanceof UserDefinedType && toT.definition instanceof StructDefinition) {
                const fields = toT.definition.vMembers.filter(
                    (fieldDef) => fieldDef.name === node.memberName
                );

                if (fields.length === 1) {
                    assert(
                        fields[0].vType !== undefined,
                        "Field type is not set for {0}",
                        fields[0]
                    );

                    return specializeType(this.typeNameToTypeNode(fields[0].vType), baseT.location);
                }
            }

            if (toT instanceof ArrayType || toT instanceof BytesType) {
                if (node.memberName === "length") {
                    return types.uint256;
                }

                /**
                 * https://github.com/ethereum/solidity/releases/tag/v0.6.0
                 */
                if (node.memberName === "push") {
                    const isZeroArg =
                        node.parent instanceof FunctionCall && node.parent.vArguments.length === 0;

                    // In newer solidity versions you are allowed to do push() with no args,
                    // Which returns a reference to the new location
                    if (isZeroArg) {
                        return new BuiltinFunctionType(
                            undefined,
                            [],
                            [toT instanceof BytesType ? types.byte : toT.elementT]
                        );
                    }

                    return new BuiltinFunctionType(
                        undefined,
                        [toT instanceof BytesType ? types.byte : toT.elementT],
                        lt(this.version, "0.6.0") ? [types.uint256] : []
                    );
                }

                if (node.memberName === "pop") {
                    return new BuiltinFunctionType(undefined, [], []);
                }
            }
        }

        if (baseT instanceof TypeNameType) {
            if (baseT.type instanceof UserDefinedType) {
                const def = baseT.type.definition;

                if (def instanceof EnumDefinition) {
                    if (def.vMembers.map((val) => val.name).includes(node.memberName)) {
                        return baseT.type;
                    }
                }

                if (def instanceof ContractDefinition) {
                    const res = this.typeOfResolved(node.memberName, def, false);

                    if (res) {
                        return res;
                    }
                }
            }

            if (baseT.type instanceof BytesType || baseT.type instanceof StringType) {
                if (node.memberName === "concat") {
                    const argTs = [];

                    if (node.parent instanceof FunctionCall) {
                        argTs.push(...node.parent.vArguments.map((arg) => this.typeOf(arg)));

                        for (const argT of argTs) {
                            if (!(argT instanceof PointerType && eq(argT.to, baseT.type))) {
                                throw new SolTypeError(
                                    `Unexpected arguments to concat in ${pp(node.parent)}`
                                );
                            }
                        }
                    }

                    return new BuiltinFunctionType("concat", argTs, [
                        new PointerType(baseT.type, DataLocation.Memory)
                    ]);
                }
            }
        }

        if (baseT instanceof BuiltinStructType) {
            /// abi.decode is a special case as we need to unwrap the types
            /// inside the tuple as return types
            if (baseT.name === "abi" && node.memberName === "decode") {
                if (node.parent instanceof ExpressionStatement) {
                    return new BuiltinFunctionType("decode", [], []);
                }

                assert(
                    node.parent instanceof FunctionCall &&
                        node.parent.vArguments.length === 2 &&
                        node.parent.vArguments[1] instanceof TupleExpression,
                    "Unexpected use of abi.decode outside a function call {0}",
                    node.parent
                );

                const retTs: TypeNode[] = [];

                for (const typeExpr of (node.parent.vArguments[1] as TupleExpression).vComponents) {
                    const componentT = this.typeOf(typeExpr);

                    assert(
                        componentT instanceof TypeNameType,
                        "Expected type in abi.decode not {0}",
                        componentT
                    );

                    /**
                     * Components of second arg of decode() are plain types,
                     * however they got specialized or slightly promoted on assigment.
                     */
                    if (componentT.type instanceof AddressType && !componentT.type.payable) {
                        retTs.push(types.addressPayable);
                    } else {
                        retTs.push(specializeType(componentT.type, DataLocation.Memory));
                    }
                }

                return new BuiltinFunctionType(
                    "decode",
                    [types.bytesMemory, this.typeOf(node.parent.vArguments[1])],
                    retTs
                );
            }

            const type = baseT.getFieldForVersion(node.memberName, this.version);

            if (type) {
                return type;
            }
        }

        if (
            baseT instanceof FunctionLikeSetType ||
            baseT instanceof FunctionType ||
            baseT instanceof EventType ||
            baseT instanceof ErrorType
        ) {
            if (node.memberName === "selector") {
                return baseT instanceof EventType ? types.bytes32 : types.bytes4;
            }
        }

        if (baseT instanceof FunctionLikeSetType || baseT instanceof FunctionType) {
            if (node.memberName === "address") {
                return types.address;
            }
        }

        if (
            baseT instanceof FunctionLikeSetType ||
            baseT instanceof FunctionType ||
            baseT instanceof BuiltinFunctionType
        ) {
            if (node.memberName === "gas" || node.memberName === "value") {
                return new BuiltinFunctionType(node.memberName, [types.uint256], [baseT]);
            }
        }

        if (baseT instanceof FixedBytesType) {
            if (node.memberName === "length") {
                return types.uint8;
            }
        }

        if (baseT instanceof AddressType) {
            let builtinStruct: BuiltinStructType;

            if (lt(this.version, "0.6.0")) {
                builtinStruct = addressBuiltins;
            } else {
                builtinStruct = baseT.payable ? address06PayableBuiltins : address06Builtins;
            }

            const field = builtinStruct.getFieldForVersion(node.memberName, this.version);

            if (field) {
                return field;
            }
        }

        if (baseT instanceof ImportRefType) {
            const res = this.typeOfResolved(node.memberName, baseT.importStmt.vSourceUnit, false);

            if (res) {
                return res;
            }
        }

        if (
            baseT instanceof TypeNameType &&
            baseT.type instanceof UserDefinedType &&
            baseT.type.definition instanceof UserDefinedValueTypeDefinition
        ) {
            const innerT = this.typeNameToTypeNode(baseT.type.definition.underlyingType);

            if (node.memberName === "wrap") {
                return new BuiltinFunctionType("wrap", [innerT], [baseT.type]);
            }

            if (node.memberName === "unwrap") {
                return new BuiltinFunctionType("unwrap", [baseT.type], [innerT]);
            }
        }

        if (baseT instanceof SuperType) {
            const res = this.typeOfResolved(
                node.memberName,
                baseT.contract.vLinearizedBaseContracts.slice(1),
                false
            );

            if (res && (res instanceof FunctionType || res instanceof FunctionLikeSetType)) {
                return res;
            }
        }

        return undefined;
    }

    typeOfNewExpression(newExpr: NewExpression): TypeNode {
        const typ = this.typeNameToTypeNode(newExpr.vTypeName);
        const loc =
            typ instanceof UserDefinedType && typ.definition instanceof ContractDefinition
                ? DataLocation.Storage
                : DataLocation.Memory;

        const resT = specializeType(typ, loc);

        /// If there is an explicit constructor, just return its function type.
        /// (make sure to add the proper returns, as declared constructors have no return)
        if (
            typ instanceof UserDefinedType &&
            typ.definition instanceof ContractDefinition &&
            typ.definition.vConstructor
        ) {
            const constrType = this.funDefToType(typ.definition.vConstructor);

            constrType.returns.push(resT);

            return constrType;
        }

        /// Builtin constructor/array creation case
        const argTs =
            typ instanceof ArrayType || typ instanceof PackedArrayType ? [types.uint256] : [];

        return new BuiltinFunctionType(undefined, argTs, [resT]);
    }

    typeOfTupleExpression(node: TupleExpression): TypeNode {
        const componentTs = node.vOriginalComponents.map((cmp) =>
            cmp === null ? cmp : this.typeOf(cmp)
        );

        if (!node.isInlineArray) {
            if (componentTs.length === 1) {
                const resT = componentTs[0];

                assert(
                    resT !== null,
                    "Empty tuple elements are disallowed for inline arrays. Got {0}",
                    node
                );

                return resT;
            }

            return new TupleType(componentTs);
        }

        assert(node.vComponents.length > 0, "Can't have an empty array initializer");
        assert(
            forAll(componentTs, (elT) => elT !== null),
            "Empty tuple elements are disallowed. Got {0}",
            node
        );

        let elT = componentTs.reduce((prev, cur) =>
            this.inferCommonType(prev as TypeNode, cur as TypeNode)
        ) as TypeNode;

        if (elT instanceof IntLiteralType) {
            const concreteT = elT.smallestFittingType();

            assert(
                concreteT !== undefined,
                "Unable to figure out concrete type for array of literals {0}",
                node
            );

            elT = concreteT;
        }

        elT = specializeType(generalizeType(elT)[0], DataLocation.Memory);

        return new PointerType(
            new ArrayType(elT, BigInt(node.components.length)),
            DataLocation.Memory
        );
    }

    typeOfUnaryOperation(node: UnaryOperation): TypeNode {
        const customType = this.typeOfCustomizableOperation(node);

        if (customType) {
            return customType;
        }

        if (node.operator === "!") {
            return types.bool;
        }

        if (node.operator === "delete") {
            return types.noType;
        }

        const innerT = this.typeOf(node.vSubExpression);

        if (unaryImpureOperators.includes(node.operator)) {
            return innerT;
        }

        if (innerT instanceof NumericLiteralType) {
            const res = evalConstantExpr(node, this);

            assert(
                res instanceof Decimal || typeof res === "bigint",
                "Unexpected result of const unary op"
            );

            return typeof res === "bigint"
                ? new IntLiteralType(res)
                : new RationalLiteralType(decimalToRational(res));
        }

        if (node.operator === "-" || node.operator === "+" || node.operator === "~") {
            return innerT;
        }

        throw new Error(`NYI unary operator ${node.operator} in ${pp(node)}`);
    }

    typeOfElementaryTypeNameExpression(node: ElementaryTypeNameExpression): TypeNameType {
        let innerT: TypeNode;

        if (node.typeName instanceof TypeName) {
            innerT = this.typeNameToTypeNode(node.typeName);
        } else {
            const elementaryT = InferType.elementaryTypeNameStringToTypeNode(node.typeName);

            assert(
                elementaryT !== undefined,
                'NYI converting elementary type name "{0}"',
                node.typeName
            );

            innerT = elementaryT;
        }

        return new TypeNameType(innerT);
    }

    /**
     * Given an expression infer its type.
     */
    typeOf(node: Expression): TypeNode {
        if (node instanceof Assignment) {
            return this.typeOfAssignment(node);
        }

        if (node instanceof BinaryOperation) {
            return this.typeOfBinaryOperation(node);
        }

        if (node instanceof Conditional) {
            return this.typeOfConditional(node);
        }

        if (node instanceof ElementaryTypeNameExpression) {
            return this.typeOfElementaryTypeNameExpression(node);
        }

        if (node instanceof FunctionCall) {
            return this.typeOfFunctionCall(node);
        }

        if (node instanceof Identifier) {
            return this.typeOfIdentifier(node);
        }

        if (node instanceof IndexAccess) {
            return this.typeOfIndexAccess(node);
        }

        if (node instanceof IndexRangeAccess) {
            return this.typeOfIndexRangeAccess(node);
        }

        if (node instanceof Literal) {
            return this.typeOfLiteral(node);
        }

        if (node instanceof MemberAccess) {
            return this.typeOfMemberAccess(node);
        }

        if (node instanceof NewExpression) {
            return this.typeOfNewExpression(node);
        }

        if (node instanceof TupleExpression) {
            return this.typeOfTupleExpression(node);
        }

        if (node instanceof UnaryOperation) {
            return this.typeOfUnaryOperation(node);
        }

        if (node instanceof FunctionCallOptions) {
            return this.typeOf(node.vExpression);
        }

        throw new Error(`NYI type inference of node ${node.constructor.name}`);
    }

    /**
     * Given a `name` and a ASTNode `ctx`, resolve that `name` in `ctx` and compute
     * a type for the one (or more) definitions that resolve to `name`.
     *
     * There are 2 cases for contracts (determined by the `externalOnly` argument).:
     * 1. MemberAccess on contract pointer (e.g. this.foo). Only external public
     *    functions and public getters returned
     * 2. MemberAccess on a contract type name (e.g. ContractName.foo). All
     *    functions, state variables, and type defs in that contract are now
     *    visible.
     */
    typeOfResolved(
        name: string,
        ctxs: ASTNode | ASTNode[],
        externalOnly: boolean
    ): TypeNode | undefined {
        if (ctxs instanceof ASTNode) {
            ctxs = [ctxs];
        }

        const defs: AnyResolvable[] = [];

        for (const ctx of ctxs) {
            defs.push(...resolveAny(name, ctx, this, true));
        }

        if (defs.length === 0) {
            return undefined;
        }

        const funs = defs.filter(
            (def): def is FunctionDefinition =>
                def instanceof FunctionDefinition &&
                (!externalOnly || // Only external/public functions visible on lookups on contract pointers
                    def.visibility === FunctionVisibility.External ||
                    def.visibility === FunctionVisibility.Public)
        );

        const getters = defs.filter(
            (def): def is VariableDeclaration =>
                def instanceof VariableDeclaration &&
                (!externalOnly || def.visibility === StateVariableVisibility.Public) // Only public vars are visible on lookups on contract pointers.
        );

        const typeDefs = defs.filter(
            (def): def is StructDefinition | EnumDefinition | ContractDefinition =>
                !externalOnly && // Type Defs are not visible on lookups on contract pointers.
                (def instanceof StructDefinition ||
                    def instanceof EnumDefinition ||
                    def instanceof ContractDefinition)
        );

        const eventDefs = defs.filter(
            (def): def is EventDefinition => !externalOnly && def instanceof EventDefinition
        );

        const errorDefs = defs.filter(
            (def): def is ErrorDefinition => !externalOnly && def instanceof ErrorDefinition
        );

        // For external calls its possible to have a mixture of functions and getters
        if (funs.length > 0 && externalOnly && getters.length > 0) {
            const nCallable = funs.length + getters.length;

            assert(
                nCallable === defs.length,
                "Unexpected number of callable matching {0} in {1}",
                name,
                ctxs
            );

            return new FunctionLikeSetType([
                ...funs.map((funDef) => this.funDefToType(funDef)),
                ...getters.map((varDecl) => this.getterFunType(varDecl))
            ]);
        }

        if (funs.length > 0) {
            assert(
                getters.length === 0 &&
                    typeDefs.length === 0 &&
                    eventDefs.length === 0 &&
                    errorDefs.length === 0,
                "Unexpected both functions and others matching {0} in {1}",
                name,
                ctxs
            );

            if (funs.length === 1) {
                const res = this.funDefToType(funs[0]);

                /**
                 * @todo (Pavel) Consider checking if resolved function is externally accessible (external, public)
                 */

                return res;
            }

            return new FunctionLikeSetType(funs.map((funDef) => this.funDefToType(funDef)));
        }

        if (getters.length > 0) {
            assert(
                funs.length === 0 &&
                    typeDefs.length === 0 &&
                    eventDefs.length === 0 &&
                    errorDefs.length === 0,
                "Unexpected both getters and others matching {0} in {1}",
                name,
                ctxs
            );

            assert(getters.length === 1, "Unexpected overloading between getters for {0}", name);

            return externalOnly
                ? this.getterFunType(getters[0])
                : this.variableDeclarationToTypeNode(getters[0]);
        }

        if (errorDefs.length > 0) {
            assert(
                errorDefs.length === defs.length,
                "Unexpected both getters and others matching {0} in {1}",
                name,
                ctxs
            );

            assert(
                errorDefs.length === 1,
                "Unexpected overloading between errorDefs for {0}",
                name
            );

            return this.errDefToType(errorDefs[0]);
        }

        if (eventDefs.length > 0) {
            assert(
                eventDefs.length === defs.length,
                "Unexpected both events and others matching {0} in {1}",
                name,
                ctxs
            );

            if (eventDefs.length === 1) {
                return this.eventDefToType(eventDefs[0]);
            }

            return new FunctionLikeSetType(eventDefs.map((evtDef) => this.eventDefToType(evtDef)));
        }

        if (typeDefs.length > 0) {
            assert(typeDefs.length == 1, "Unexpected number of type defs {0}", name);

            const def = typeDefs[0];
            const fqName = getFQDefName(def);

            return new TypeNameType(new UserDefinedType(fqName, def));
        }

        return undefined;
    }

    /**
     * Infer the data location for the given `VariableDeclaration`.
     * For local vars with solidity <=0.4.26 we infer the location from the RHS.
     */
    inferVariableDeclLocation(decl: VariableDeclaration): DataLocation {
        if (decl.stateVariable) {
            return decl.constant ? DataLocation.Memory : DataLocation.Storage;
        }

        if (decl.storageLocation !== DataLocation.Default) {
            return decl.storageLocation;
        }

        if (decl.parent instanceof ParameterList) {
            // In 0.4.x param/return locations may be omitted. We assume calldata
            // for external function parameters and memory for all other cases
            const fun = decl.parent.parent as FunctionDefinition;

            return fun.visibility === FunctionVisibility.External && decl.parent === fun.vParameters
                ? DataLocation.CallData
                : DataLocation.Memory;
        }

        if (decl.parent instanceof VariableDeclarationStatement) {
            // In 0.4.x local var locations may be omitted. Try and infer it from the RHS, otherwise assume storage.
            const rhsT = this.getRHSTypeForDecl(decl, decl.parent);

            if (rhsT && rhsT instanceof PointerType) {
                return rhsT.location;
            }

            return DataLocation.Storage;
        }

        if (decl.parent instanceof StructDefinition) {
            return DataLocation.Default;
        }

        if (decl.parent instanceof SourceUnit) {
            // Global vars don't have a location (no ref types yet)
            return DataLocation.Default;
        }

        throw new Error(`NYI variable declaration ${pp(decl)}`);
    }

    /**
     * Given a `VariableDeclaration` node compute the `TypeNode` that corresponds to the variable.
     * This takes into account the storage location of the `decl`.
     */
    variableDeclarationToTypeNode(decl: VariableDeclaration): TypeNode {
        assert(decl.vType !== undefined, "Expected {0} to have type", decl);

        const generalType = this.typeNameToTypeNode(decl.vType);

        if (isReferenceType(generalType)) {
            const loc = this.inferVariableDeclLocation(decl);

            return specializeType(generalType, loc);
        }

        return generalType;
    }

    /**
     * Convert a `FunctionDefinition` `def` into a function type.
     * If `skipFirstArg` is true, omit the first parameter.
     * This is used for functions bound with `using for` directives.
     */
    funDefToType(def: FunctionDefinition, implicitFirstArg = false): FunctionType {
        const argTs = def.vParameters.vParameters.map((arg) =>
            this.variableDeclarationToTypeNode(arg)
        );

        const retTs = def.vReturnParameters.vParameters.map((arg) =>
            this.variableDeclarationToTypeNode(arg)
        );

        return new FunctionType(
            isVisiblityExternallyCallable(def.visibility) ? def.name : undefined,
            argTs,
            retTs,
            def.visibility,
            def.stateMutability,
            implicitFirstArg
        );
    }

    eventDefToType(def: EventDefinition): EventType {
        const argTs = def.vParameters.vParameters.map((arg) =>
            this.variableDeclarationToTypeNode(arg)
        );

        return new EventType(def.name, argTs);
    }

    errDefToType(def: ErrorDefinition): ErrorType {
        const argTs = def.vParameters.vParameters.map((arg) =>
            this.variableDeclarationToTypeNode(arg)
        );

        return new ErrorType(def.name, argTs);
    }

    /**
     * Computes the function type for the public accessor corresponding to a state variable
     */
    getterFunType(v: VariableDeclaration): FunctionType {
        const [args, ret] = this.getterArgsAndReturn(v);

        return new FunctionType(
            v.name,
            args,
            ret instanceof TupleType ? (ret.elements as TypeNode[]) : [ret],
            FunctionVisibility.External,
            FunctionStateMutability.View
        );
    }

    getUnitLevelAbiEncoderVersion(node: ASTNode): ABIEncoderVersion {
        const root = node.root;

        assert(root instanceof SourceUnit, "Node {0} is not attached to source unit", node);

        return getABIEncoderVersion(root, this.version);
    }

    /**
     * Computes the argument types and return type for the public accessor
     * corresponding to a state variable.
     */
    getterArgsAndReturn(v: VariableDeclaration): [TypeNode[], TypeNode] {
        const argTypes: TypeNode[] = [];

        let type = v.vType;

        assert(
            type !== undefined,
            "Called getterArgsAndReturn() on variable declaration without type",
            v
        );

        const encoderVersion = this.getUnitLevelAbiEncoderVersion(v);

        while (true) {
            if (type instanceof ArrayTypeName) {
                argTypes.push(new IntType(256, false));

                type = type.vBaseType;
            } else if (type instanceof Mapping) {
                argTypes.push(
                    this.typeNameToSpecializedTypeNode(type.vKeyType, DataLocation.Memory)
                );

                type = type.vValueType;
            } else {
                break;
            }
        }

        let retType = this.typeNameToSpecializedTypeNode(type, DataLocation.Memory);

        if (
            retType instanceof PointerType &&
            retType.to instanceof UserDefinedType &&
            retType.to.definition instanceof StructDefinition
        ) {
            const elements: TypeNode[] = [];

            for (const member of retType.to.definition.vMembers) {
                const rawMemberT = member.vType;

                assert(
                    rawMemberT !== undefined,
                    "Unexpected untyped struct member",
                    retType.to.definition
                );

                if (rawMemberT instanceof Mapping || rawMemberT instanceof ArrayTypeName) {
                    continue;
                }

                const memberT = this.typeNameToSpecializedTypeNode(rawMemberT, DataLocation.Memory);

                if (
                    rawMemberT instanceof UserDefinedTypeName &&
                    rawMemberT.vReferencedDeclaration instanceof StructDefinition
                ) {
                    assert(
                        encoderVersion !== ABIEncoderVersion.V1 || isSupportedByEncoderV1(memberT),
                        "Type {0} is not supported by encoder {1}",
                        memberT,
                        encoderVersion
                    );
                }

                elements.push(memberT);
            }

            retType = new TupleType(elements);
        }

        return [argTypes, retType];
    }

    /**
     * Given the `name` string of elementary type,
     * returns corresponding type node.
     *
     * @todo Consider fixes due to https://github.com/ConsenSys/solc-typed-ast/issues/160
     */
    static elementaryTypeNameStringToTypeNode(name: string): TypeNode | undefined {
        name = name.trim();

        if (name === "bool") {
            return new BoolType();
        }

        let m = name.match(RX_INTEGER);

        if (m !== null) {
            const isSigned = m[1] !== "u";
            const bitWidth = m[2] === "" ? 256 : parseInt(m[2]);

            return new IntType(bitWidth, isSigned);
        }

        m = name.match(RX_ADDRESS);

        if (m !== null) {
            const isPayable = m[1] === "payable";

            return new AddressType(isPayable);
        }

        m = name.match(RX_FIXED_BYTES);

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

        return undefined;
    }

    /**
     * Convert a given ast `TypeName` into a `TypeNode`.
     * This produces "general type patterns" without any specific storage information.
     */
    typeNameToTypeNode(node: TypeName): TypeNode {
        if (node instanceof ElementaryTypeName) {
            const type = InferType.elementaryTypeNameStringToTypeNode(node.name);

            assert(type !== undefined, 'NYI converting elementary type name "{0}"', node.name);

            /**
             * The payability marker of an "address" type is contained
             * in `stateMutability` property instead of "name" string.
             */
            if (type instanceof AddressType) {
                type.payable = node.stateMutability === "payable";
            }

            return type;
        }

        if (node instanceof ArrayTypeName) {
            const elT = this.typeNameToTypeNode(node.vBaseType);

            let size: bigint | undefined;

            if (node.vLength) {
                const result = evalConstantExpr(node.vLength, this);

                assert(
                    typeof result === "bigint",
                    "Expected bigint for size of an array type",
                    node
                );

                size = result;
            }

            return new ArrayType(elT, size);
        }

        if (node instanceof UserDefinedTypeName) {
            const def = node.vReferencedDeclaration;

            if (
                def instanceof StructDefinition ||
                def instanceof EnumDefinition ||
                def instanceof ContractDefinition ||
                def instanceof UserDefinedValueTypeDefinition
            ) {
                return new UserDefinedType(getFQDefName(def), def);
            }

            throw new Error(`NYI converting user-defined AST type ${def.print()} to TypeNode`);
        }

        if (node instanceof FunctionTypeName) {
            /**
             * `vType` is always defined here for parameters if a function type.
             * Even in 0.4.x can't have function declarations with `var` args.
             */
            const args = node.vParameterTypes.vParameters.map((arg) =>
                this.variableDeclarationToTypeNode(arg)
            );

            const rets = node.vReturnParameterTypes.vParameters.map((arg) =>
                this.variableDeclarationToTypeNode(arg)
            );

            return new FunctionType(undefined, args, rets, node.visibility, node.stateMutability);
        }

        if (node instanceof Mapping) {
            const keyT = this.typeNameToTypeNode(node.vKeyType);
            const valueT = this.typeNameToTypeNode(node.vValueType);

            return new MappingType(keyT, valueT);
        }

        throw new Error(`NYI converting AST type ${node.print()} to TypeNode`);
    }

    /**
     * Computes a `TypeNode` equivalent of given `astT`,
     * specialized for location `loc` (if applicable).
     */
    typeNameToSpecializedTypeNode(astT: TypeName, loc: DataLocation): TypeNode {
        return specializeType(this.typeNameToTypeNode(astT), loc);
    }

    /**
     * Determine if the specified type `typ` is dynamic or not. Dynamic means
     * that if we are trying to read `typ` at location `loc`, in `loc` there should be just a
     * uint256 offset into memory/storage/calldata, where the actual data lives. Otherwise
     * (if the type is "static"), the direct encoding of the data will start at `loc`.
     *
     * Usually "static" types are just the value types - i.e. anything of statically
     * known size that fits in a uint256. As per https://docs.soliditylang.org/en/latest/abi-spec.html#formal-specification-of-the-encoding
     * there are several exceptions to the rule when encoding types in calldata:
     *
     * 1. Fixed size arrays with fixed-sized element types
     * 2. Tuples where all the tuple elements are fixed-size
     *
     * @todo (Dimo):
     * 1. Check again that its not possible for tuples in internal calls to somehow get encoded on the stack
     * 2. What happens with return tuples? Are they always in memory?
     */
    isABITypeEncodingDynamic(typ: TypeNode): boolean {
        if (
            typ instanceof PointerType ||
            typ instanceof ArrayType ||
            typ instanceof StringType ||
            typ instanceof BytesType
        ) {
            return true;
        }

        // Tuples in calldata with static elements
        if (typ instanceof TupleType) {
            for (const elT of typ.elements) {
                assert(elT !== null, `Unexpected empty tuple element in {0}`, typ);

                if (this.isABITypeEncodingDynamic(elT)) {
                    return true;
                }
            }

            return false;
        }

        return false;
    }

    isABIEncodable(type: TypeNode, encoderVersion: ABIEncoderVersion): boolean {
        if (
            type instanceof AddressType ||
            type instanceof BoolType ||
            type instanceof BytesType ||
            type instanceof FixedBytesType ||
            (type instanceof FunctionType &&
                (type.visibility === FunctionVisibility.External ||
                    type.visibility === FunctionVisibility.Public)) ||
            type instanceof IntType ||
            type instanceof IntLiteralType ||
            type instanceof StringLiteralType ||
            type instanceof StringType
        ) {
            return true;
        }

        if (type instanceof PointerType) {
            return this.isABIEncodable(type.to, encoderVersion);
        }

        if (encoderVersion === ABIEncoderVersion.V1 && !isSupportedByEncoderV1(type)) {
            return false;
        }

        if (type instanceof ArrayType) {
            return this.isABIEncodable(type.elementT, encoderVersion);
        }

        if (type instanceof UserDefinedType) {
            if (
                type.definition instanceof ContractDefinition ||
                type.definition instanceof EnumDefinition ||
                type.definition instanceof UserDefinedValueTypeDefinition
            ) {
                return true;
            }

            if (type.definition instanceof StructDefinition) {
                return type.definition.vMembers.every((field) =>
                    this.isABIEncodable(this.variableDeclarationToTypeNode(field), encoderVersion)
                );
            }
        }

        return false;
    }

    /**
     * Convert an internal TypeNode to the external TypeNode that would correspond to it
     * after ABI-encoding with encoder version `encoderVersion`. Follows the following rules:
     *
     * 1. Contract definitions turned to address.
     * 2. Enum definitions turned to uint of minimal fitting size.
     * 3. Storage pointer types are converted to memory pointer types when `normalizePointers` is set to `true`.
     * 4. Throw an error on any nested mapping types.
     * 5. Fixed-size arrays with fixed-sized element types are encoded as inlined tuples
     * 6. Structs with fixed-sized elements are encoded as inlined tuples
     *
     * @see https://docs.soliditylang.org/en/latest/abi-spec.html
     */
    toABIEncodedType(
        type: TypeNode,
        encoderVersion: ABIEncoderVersion,
        normalizePointers = false
    ): TypeNode {
        assert(
            this.isABIEncodable(type, encoderVersion),
            'Can not ABI-encode type "{0}" with encoder "{1}"',
            type,
            encoderVersion
        );

        if (type instanceof ArrayType) {
            const elT = this.toABIEncodedType(type.elementT, encoderVersion);

            return new ArrayType(elT, type.size);
        }

        if (type instanceof PointerType) {
            const toT = this.toABIEncodedType(type.to, encoderVersion, normalizePointers);

            return this.isABITypeEncodingDynamic(toT)
                ? new PointerType(toT, normalizePointers ? DataLocation.Memory : type.location)
                : toT;
        }

        if (type instanceof UserDefinedType) {
            if (type.definition instanceof UserDefinedValueTypeDefinition) {
                return this.typeNameToTypeNode(type.definition.underlyingType);
            }

            if (type.definition instanceof ContractDefinition) {
                return types.address;
            }

            if (type.definition instanceof EnumDefinition) {
                return enumToIntType(type.definition);
            }

            if (type.definition instanceof StructDefinition) {
                const fieldTs = type.definition.vMembers.map((fieldT) =>
                    this.variableDeclarationToTypeNode(fieldT)
                );

                return new TupleType(
                    fieldTs.map((fieldT) =>
                        this.toABIEncodedType(fieldT, encoderVersion, normalizePointers)
                    )
                );
            }
        }

        return type;
    }

    /**
     * Returns canonical representation of the signature as string.
     *
     * NOTE: Empty string will be returned for fallback functions and constructors.
     */
    signature(
        node:
            | FunctionDefinition
            | EventDefinition
            | ErrorDefinition
            | ModifierDefinition
            | VariableDeclaration
            | TryCatchClause
    ): string {
        let name: string;
        let args: string[];

        const encoderVersion = this.getUnitLevelAbiEncoderVersion(node);

        if (node instanceof VariableDeclaration) {
            name = node.name;

            const [getterArgs] = this.getterArgsAndReturn(node);

            args = getterArgs.map((type) =>
                abiTypeToCanonicalName(this.toABIEncodedType(type, encoderVersion, true))
            );
        } else if (node instanceof TryCatchClause) {
            if (node.errorName === "") {
                return "";
            }

            name = node.errorName;

            args = node.vParameters
                ? node.vParameters.vParameters.map((arg) => {
                      const type = this.variableDeclarationToTypeNode(arg);
                      const abiType = this.toABIEncodedType(type, encoderVersion);

                      return abiTypeToCanonicalName(generalizeType(abiType)[0]);
                  })
                : [];
        } else {
            if (node instanceof FunctionDefinition && (node.name === "" || node.isConstructor)) {
                return "";
            }

            name = node.name;

            // Signatures are computed differently depending on
            // whether this is a library function or a contract method
            if (
                node.vScope instanceof ContractDefinition &&
                (node.vScope.kind === ContractKind.Library ||
                    (node instanceof FunctionDefinition &&
                        !isVisiblityExternallyCallable(node.visibility)))
            ) {
                args = node.vParameters.vParameters.map((arg) => {
                    const type = this.variableDeclarationToTypeNode(arg);

                    return abiTypeToLibraryCanonicalName(type);
                });
            } else {
                args = node.vParameters.vParameters.map((arg) => {
                    const type = this.variableDeclarationToTypeNode(arg);
                    const abiType = this.toABIEncodedType(type, encoderVersion);

                    return abiTypeToCanonicalName(generalizeType(abiType)[0]);
                });
            }
        }

        return name + "(" + args.join(",") + ")";
    }

    /**
     * Returns HEX string containing first 4 bytes of keccak256 hash function
     * applied to the canonical representation of the passed
     * function / event / error / modifier or public state variable getter signature.
     *
     * NOTE: Empty string will be returned for fallback functions and constructors.
     */
    signatureHash(
        node:
            | FunctionDefinition
            | EventDefinition
            | ErrorDefinition
            | ModifierDefinition
            | VariableDeclaration
            | TryCatchClause
    ): string {
        if (node instanceof FunctionDefinition || node instanceof TryCatchClause) {
            const signature = this.signature(node);

            return signature ? encodeFuncSignature(signature) : "";
        }

        if (
            node instanceof VariableDeclaration ||
            node instanceof ErrorDefinition ||
            node instanceof ModifierDefinition
        ) {
            return encodeFuncSignature(this.signature(node));
        }

        if (node instanceof EventDefinition) {
            return encodeEventSignature(this.signature(node));
        }

        throw new Error(`Unable to compute signature hash for node ${pp(node)}`);
    }

    interfaceId(contract: ContractDefinition): string | undefined {
        if (
            contract.kind === ContractKind.Interface ||
            (contract.kind === ContractKind.Contract && contract.abstract)
        ) {
            const selectors: string[] = [];

            for (const fn of contract.vFunctions) {
                const hash = this.signatureHash(fn);

                if (hash) {
                    selectors.push(hash);
                }
            }

            for (const v of contract.vStateVariables) {
                if (v.visibility === StateVariableVisibility.Public) {
                    selectors.push(this.signatureHash(v));
                }
            }

            return selectors
                .map((selector) => BigInt("0x" + selector))
                .reduce((a, b) => a ^ b, 0n)
                .toString(16)
                .padStart(8, "0");
        }

        return undefined;
    }

    /**
     * Given a particular `FunctionCall` site, resolve the exact callee,
     * accounting for potential overloading.
     *
     * A callsite may come from:
     * 1. A normal call (FunctionType, BuiltinFunctionType, FunctionLikeSetType)
     * 2. An emit statement (EventType)
     * 3. A revert statement (ErrorType).
     *
     * In the case that the callee is a `FunctionLikeSetType`, resolve the exact callee
     * based on the function call arguments. Otherwise return the type of the callee.
     */
    typeOfCallee(
        callsite: FunctionCall
    ): FunctionType | BuiltinFunctionType | EventType | ErrorType | undefined {
        assert(
            callsite.kind === FunctionCallKind.FunctionCall,
            `typeOfCallee() cannot be called on a call {0} of type {1}`,
            callsite,
            callsite.kind
        );

        const calleeT = this.typeOf(callsite.vExpression);

        assert(
            calleeT instanceof FunctionType ||
                calleeT instanceof BuiltinFunctionType ||
                calleeT instanceof EventType ||
                calleeT instanceof ErrorType ||
                calleeT instanceof FunctionLikeSetType,
            `Unexpected type {0} of callee {1}`,
            calleeT,
            callsite.vExpression
        );

        if (
            calleeT instanceof FunctionType ||
            calleeT instanceof EventType ||
            calleeT instanceof ErrorType
        ) {
            return calleeT;
        }

        if (calleeT instanceof BuiltinFunctionType) {
            return this.specializeBuiltinTypeToCall(callsite, calleeT);
        }

        // FunctionLikeSetType - resolve based on call arguments
        const resolvedCalleeT = this.matchArguments(calleeT.defs, callsite);

        return resolvedCalleeT;
    }

    private isExternalCallContext(expr: Expression): boolean {
        if (
            expr instanceof Identifier ||
            expr instanceof MemberAccess ||
            expr instanceof FunctionCallOptions ||
            expr instanceof FunctionCall
        ) {
            const exprT = this.typeOf(expr);

            if (exprT instanceof UserDefinedType) {
                if (exprT.definition instanceof ContractDefinition) {
                    return true;
                }
            }

            if (exprT instanceof TypeNameType) {
                return (
                    exprT.type instanceof UserDefinedType &&
                    exprT.type.definition instanceof ContractDefinition &&
                    exprT.type.definition.kind === ContractKind.Library
                );
            }
        }

        if (
            expr instanceof MemberAccess ||
            expr instanceof FunctionCallOptions ||
            expr instanceof FunctionCall
        ) {
            return this.isExternalCallContext(expr.vExpression);
        }

        if (expr instanceof Conditional) {
            return (
                this.isExternalCallContext(expr.vTrueExpression) ||
                this.isExternalCallContext(expr.vFalseExpression)
            );
        }

        if (expr instanceof TupleExpression && expr.vComponents.length === 1) {
            return this.isExternalCallContext(expr.vComponents[0]);
        }

        return false;
    }

    isFunctionCallExternal(call: FunctionCall): boolean {
        if (call.kind !== FunctionCallKind.FunctionCall) {
            return false;
        }

        if (
            call.vFunctionCallType === ExternalReferenceType.Builtin &&
            CALL_BUILTINS.includes(call.vFunctionName)
        ) {
            return true;
        }

        let exprT = this.typeOf(call.vExpression);

        if (exprT instanceof FunctionLikeSetType) {
            const calleeT = this.typeOfCallee(call);

            if (!(calleeT instanceof FunctionType)) {
                return false;
            }

            exprT = calleeT;
        }

        if (exprT instanceof FunctionType) {
            if (exprT.implicitFirstArg) {
                /**
                 * Calls via using-for are not considered as external.
                 * Currently "implicitFirstArg" is used only for using-for.
                 */
                return false;
            }

            if (exprT.visibility === FunctionVisibility.External) {
                return true;
            }

            if (exprT.visibility === FunctionVisibility.Public) {
                return this.isExternalCallContext(call.vExpression);
            }
        }

        return false;
    }
}
