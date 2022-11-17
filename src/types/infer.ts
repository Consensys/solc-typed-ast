import { Decimal } from "decimal.js";
import { gte, lt } from "semver";
import {
    AnyResolvable,
    Assignment,
    ASTNode,
    BinaryOperation,
    Conditional,
    ContractDefinition,
    ContractKind,
    ElementaryTypeNameExpression,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    Expression,
    ExpressionStatement,
    ExternalReferenceType,
    FunctionCall,
    FunctionCallKind,
    FunctionCallOptions,
    FunctionDefinition,
    FunctionStateMutability,
    FunctionVisibility,
    Identifier,
    IdentifierPath,
    ImportDirective,
    IndexAccess,
    IndexRangeAccess,
    Literal,
    LiteralKind,
    MemberAccess,
    ModifierDefinition,
    NewExpression,
    ParameterList,
    resolveAny,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    TupleExpression,
    TypeName,
    UnaryOperation,
    UserDefinedValueTypeDefinition,
    VariableDeclaration,
    VariableDeclarationStatement
} from "../ast";
import { DataLocation } from "../ast/constants";
import { assert, eq, forAny, pp } from "../misc";
import {
    AddressType,
    ArrayType,
    BuiltinFunctionType,
    BuiltinStructType,
    BytesType,
    ErrorType,
    EventType,
    FixedBytesType,
    FunctionLikeSetType,
    FunctionSetType,
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
import {
    applySubstitution,
    applySubstitutions,
    buildSubstitutions,
    TypeSubstituion
} from "./polymorphic";
import { types } from "./reserved";
import { parse } from "./typeStrings";
import {
    castable,
    decimalToRational,
    generalizeType,
    getFallbackRecvFuns,
    getFQDefName,
    isReferenceType,
    isVisiblityExternallyCallable,
    smallestFittingType,
    specializeType,
    typeNameToTypeNode
} from "./utils";

export const unaryImpureOperators = ["++", "--"];

export const binaryOperatorGroups = {
    Arithmetic: ["+", "-", "*", "/", "%", "**"],
    Bitwise: ["<<", ">>", "&", "|", "^"],
    Comparison: ["<", ">", "<=", ">="],
    Equality: ["==", "!="],
    Logical: ["&&", "||"]
};

export const yulBinaryBuiltinGroups = {
    Arithmetic: ["add", "sub", "div", "sdiv", "exp", "mul", "mod", "smod", "signextend"],
    Bitwise: ["and", "or", "xor", "sar", "shl", "shr", "byte"],
    Comparison: ["gt", "lt", "sgt", "slt", "eq"]
};

export const subdenominationMultipliers: { [key: string]: Decimal } = {
    seconds: new Decimal(1),
    minutes: new Decimal(60),
    hours: new Decimal(3600),
    days: new Decimal(24 * 3600),
    weeks: new Decimal(7 * 24 * 3600),
    years: new Decimal(365 * 24 * 3600),
    wei: new Decimal(1),
    gwei: new Decimal(10 ** 9),
    szabo: new Decimal(10 ** 12),
    finney: new Decimal(10).toPower(15),
    ether: new Decimal(10).toPower(18)
};

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

/// Strip any singleton parens from expressions. I.e. given (((e))) returns e.
function stripSingletonParens(e: Expression): Expression {
    while (e instanceof TupleExpression && e.vOriginalComponents.length === 1) {
        const comp = e.vOriginalComponents[0];

        assert(comp !== null, 'Unexpected "null" component in tuple with single element');

        e = comp;
    }

    return e;
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

/**
 * Given two `FunctionType`s/`BuiltinFunctionType`s/`FunctionSetType`s `a` and `b`
 * return a `FunctionSetType` that includes everything in `a` and `b`.
 */
function mergeFunTypes(
    a: FunctionType | BuiltinFunctionType | FunctionSetType,
    b: FunctionType | BuiltinFunctionType | FunctionSetType
): FunctionSetType {
    const funs: Array<FunctionType | BuiltinFunctionType> = [];

    if (a instanceof FunctionType || a instanceof BuiltinFunctionType) {
        funs.push(a);
    } else {
        funs.push(...a.defs);
    }

    if (b instanceof FunctionType || b instanceof BuiltinFunctionType) {
        funs.push(b);
    } else {
        funs.push(...b.defs);
    }

    return new FunctionLikeSetType(funs);
}

/**
 * Given 2 function pointer's visibilities infer a common visibility thats compatible with both.
 * This is used to infer the visibility of the expression `flag ? fun1 : fun2` where fun1 and fun2 are
 * function pointers.
 */
function inferCommonVisiblity(
    a: FunctionVisibility,
    b: FunctionVisibility
): FunctionVisibility | undefined {
    const visiblityOrder = [
        FunctionVisibility.External,
        FunctionVisibility.Public,
        FunctionVisibility.Internal,
        FunctionVisibility.Default,
        FunctionVisibility.Private
    ];

    if (a == b) {
        return a;
    }

    if (visiblityOrder.indexOf(a) > visiblityOrder.indexOf(b)) {
        [b, a] = [a, b];
    }

    if (a === FunctionVisibility.External) {
        return b == FunctionVisibility.Public ? FunctionVisibility.External : undefined;
    }

    return FunctionVisibility.Internal;
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

            const resTs: TypeNode[] = [];

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
            const commonElTs: TypeNode[] = [];

            for (let i = 0; i < a.elements.length; i++) {
                let commonElT = this.inferCommonType(a.elements[i], b.elements[i]);

                if (commonElT instanceof IntLiteralType && commonElT.literal !== undefined) {
                    commonElT = smallestFittingType(commonElT.literal) as TypeNode;
                    assert(
                        commonElT !== undefined,
                        "Can't infer common type for tuple elements {0} between {1} and {2}",
                        i,
                        a,
                        b
                    );
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

    /**
     * Infer the type of the binary op
     */
    typeOfBinaryOperation(node: BinaryOperation): TypeNode {
        if (
            binaryOperatorGroups.Comparison.includes(node.operator) ||
            binaryOperatorGroups.Equality.includes(node.operator) ||
            binaryOperatorGroups.Logical.includes(node.operator)
        ) {
            return types.bool;
        }

        const a = this.typeOf(node.vLeftExpression);
        const b = this.typeOf(node.vRightExpression);

        if (a instanceof NumericLiteralType && b instanceof NumericLiteralType) {
            const res = evalConstantExpr(node);

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

        if (binaryOperatorGroups.Arithmetic.includes(node.operator)) {
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

        if (binaryOperatorGroups.Bitwise.includes(node.operator)) {
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
        const argT = this.typeOf(arg);

        if (arg instanceof Literal && arg.value.startsWith("0x") && arg.value.length === 42) {
            return lt(this.version, "0.6.0") ? types.addressPayable : types.address;
        }

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
            const contract = argT.definition;
            const funs = getFallbackRecvFuns(contract);

            if (forAny(funs, (fun) => fun.stateMutability === FunctionStateMutability.Payable)) {
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

        assert(newExpr instanceof NewExpression, "Unexpected vcall {0}", newExpr);

        const typ = typeNameToTypeNode(newExpr.vTypeName);
        const loc =
            typ instanceof UserDefinedType && typ.definition instanceof ContractDefinition
                ? DataLocation.Storage
                : DataLocation.Memory;

        return specializeType(typ, loc);
    }

    private matchArguments(
        funs: Array<FunctionType | BuiltinFunctionType>,
        args: Expression[],
        callExp: Expression
    ): FunctionType | BuiltinFunctionType | undefined {
        const argTs: TypeNode[] = args.map((arg) => this.typeOf(arg));
        // If we are matching with a
        const argTsWithImplictArg =
            callExp instanceof MemberAccess ? [this.typeOf(callExp.vExpression), ...argTs] : argTs;

        for (const funT of funs) {
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
     * Return true IFF the passed in node is an external callee. There are 2 cases for external calls:
     *
     * 1. The builtin functions (address).call/callcode/staticcall/delegatecall/transfer/send
     * 2. Calling a function on some variable of type ContractDefinition
     */
    private isFunctionCallExternal(callee: ASTNode, calleeT: TypeNode): boolean {
        if (!(callee instanceof MemberAccess)) {
            return false;
        }

        const name = callee.memberName;

        if (
            calleeT instanceof BuiltinFunctionType &&
            ["call", "callcode", "staticcall", "delegatecall", "transfer", "send"].includes(name)
        ) {
            return true;
        }

        const baseT = this.typeOf(callee.vExpression);
        return baseT instanceof UserDefinedType && baseT.definition instanceof ContractDefinition;
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

        let calleeT = this.typeOf(node.vCallee);

        let rets: TypeNode[];

        if (node.vFunctionCallType === ExternalReferenceType.Builtin) {
            if (calleeT instanceof FunctionLikeSetType) {
                calleeT = calleeT.defs.filter(
                    (d) => d instanceof BuiltinFunctionType
                )[0] as BuiltinFunctionType;
            }

            if (!(calleeT instanceof BuiltinFunctionType || calleeT instanceof FunctionType)) {
                throw new SolTypeError(
                    `Unexpected builtin ${pp(node.vCallee)} in function call ${pp(node)}`
                );
            }

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

            rets = applySubstitutions(calleeT.returns, m);
        } else {
            if (calleeT instanceof FunctionType || calleeT instanceof BuiltinFunctionType) {
                rets = calleeT.returns;
            } else if (calleeT instanceof EventType || calleeT instanceof ErrorType) {
                rets = [];
            } else if (calleeT instanceof FunctionLikeSetType) {
                if (calleeT.defs[0] instanceof EventDefinition) {
                    rets = [];
                } else {
                    // Match based on args. Needs castable.
                    const funT = this.matchArguments(
                        calleeT.defs,
                        node.vArguments,
                        node.vExpression
                    );

                    if (funT === undefined) {
                        throw new SolTypeError(
                            `Couldn't resolve function ${node.vFunctionName} in ${pp(node)}`
                        );
                    }

                    rets = funT.returns;
                }
            } else {
                throw new SolTypeError(
                    `Unexpected type ${calleeT.pp()} in function call ${pp(node)}`
                );
            }
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
            return applySubstitution(typeInt, new Map([["T", innerT]])) as BuiltinFunctionType;
        }

        if (innerT instanceof UserDefinedType && innerT.definition instanceof ContractDefinition) {
            const resTemplateT =
                innerT.definition.kind === ContractKind.Interface ? typeInterface : typeContract;

            return applySubstitution(resTemplateT, new Map([["T", innerT]])) as BuiltinFunctionType;
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

            return rhsT.elements[tupleIdx];
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
        if (node.kind === "number") {
            if (node.typeString === "address") {
                return new AddressType(false);
            }

            if (node.typeString === "address payable") {
                return new AddressType(true);
            }

            let val = new Decimal(node.value.replaceAll("_", ""));

            if (node.subdenomination !== undefined) {
                assert(
                    node.subdenomination in subdenominationMultipliers,
                    "Unknown subdenomination {0}",
                    node.subdenomination
                );

                val = val.times(subdenominationMultipliers[node.subdenomination]);
            }

            if (val.isInteger()) {
                return new IntLiteralType(BigInt(val.toFixed()));
            }

            return new RationalLiteralType(decimalToRational(val));
        }

        if (node.kind === "string" || node.kind === "unicodeString" || node.kind === "hexString") {
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
                        const usingForTyp = typeNameToTypeNode(usingFor.vTypeName);

                        match = eq(usingForTyp, generalizeType(baseT)[0]);
                    }

                    if (!match) {
                        continue;
                    }

                    if (usingFor.vFunctionList) {
                        for (const funId of usingFor.vFunctionList) {
                            if (funId.name === node.memberName) {
                                const funDef = funId.vReferencedDeclaration;

                                assert(
                                    funDef instanceof FunctionDefinition,
                                    "Unexpected non-function decl {0} for name {1} in using for {2}",
                                    funDef,
                                    funId.name,
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
                                `Unexpected type {0} for {1} in library {1}`,
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

    private changeLocToMemory(
        typ: FunctionType | FunctionLikeSetType<FunctionType>
    ): FunctionType | FunctionLikeSetType<FunctionType> {
        if (typ instanceof FunctionLikeSetType) {
            const funTs = typ.defs.map((funT) => this.changeLocToMemory(funT) as FunctionType);

            return new FunctionLikeSetType(funTs);
        }

        const params = typ.parameters.map((paramT) =>
            paramT instanceof PointerType && paramT.location === DataLocation.CallData
                ? specializeType(generalizeType(paramT)[0], DataLocation.Memory)
                : paramT
        );

        const rets = typ.returns.map((retT) =>
            retT instanceof PointerType && retT.location === DataLocation.CallData
                ? specializeType(generalizeType(retT)[0], DataLocation.Memory)
                : retT
        );

        return new FunctionType(
            typ.name,
            params,
            rets,
            typ.visibility,
            typ.mutability,
            typ.implicitFirstArg,
            typ.src
        );
    }

    private typeOfMemberAccessImpl(node: MemberAccess, baseT: TypeNode): TypeNode | undefined {
        if (baseT instanceof UserDefinedType && baseT.definition instanceof ContractDefinition) {
            const contract = baseT.definition;
            let fieldT = this.typeOfResolved(node.memberName, contract, true);

            let builtinT: TypeNode | undefined;

            assert(
                fieldT === undefined ||
                    fieldT instanceof FunctionType ||
                    fieldT instanceof FunctionLikeSetType,
                "External field lookup for {0} on contract must be a function, not {1}",
                node.memberName,
                fieldT
            );

            // For solidity <0.5.0 contract variables are implicitly castable to address
            if (lt(this.version, "0.5.0")) {
                builtinT = addressBuiltins.getFieldForVersion(node.memberName, this.version);
            }

            if (fieldT) {
                if (this.isFunctionCallExternal(node, baseT)) {
                    fieldT = this.changeLocToMemory(fieldT);
                }

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

                    return specializeType(typeNameToTypeNode(fields[0].vType), baseT.location);
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

                    if (componentT.type instanceof AddressType && !componentT.type.payable) {
                        /**
                         * Promote address to address payable
                         */
                        retTs.push(new AddressType(true));
                    } else {
                        /**
                         * Specialize types to memory
                         */
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
            const innerT = typeNameToTypeNode(baseT.type.definition.underlyingType);

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
        assert(newExpr instanceof NewExpression, "Unexpected vcall {0}", newExpr);

        const typ = typeNameToTypeNode(newExpr.vTypeName);
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
        const componentTs = node.vComponents.map((cmp) => this.typeOf(cmp));

        if (node.isInlineArray) {
            assert(node.vComponents.length > 0, "Can't have an empty array initialize");

            let elT = componentTs.reduce((prev, cur) => this.inferCommonType(prev, cur));

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

        return componentTs.length === 1 ? componentTs[0] : new TupleType(componentTs);
    }

    typeOfUnaryOperation(node: UnaryOperation): TypeNode {
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
            const res = evalConstantExpr(node);

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
            let innerT: TypeNode;

            if (node.typeName instanceof TypeName) {
                innerT = typeNameToTypeNode(node.typeName);
            } else {
                /// Prior to Solc 0.6.0 the TypeName is a string, which means we
                /// unfortunately still need the typeString parser for backwards compat :(
                innerT = parse(node.typeName, { ctx: node, version: this.version });
            }

            return new TypeNameType(innerT);
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

        /// FunctionCallOptions don't really get a type
        if (node instanceof FunctionCallOptions) {
            return types.noType;
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
            defs.push(...resolveAny(name, ctx, this.version, true));
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
                ...getters.map((getter) => getter.getterFunType())
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
                ? getters[0].getterFunType()
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

        const generalType = typeNameToTypeNode(decl.vType);

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
}
