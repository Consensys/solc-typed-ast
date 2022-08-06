import { gte, lt } from "semver";
import {
    AnyResolvable,
    Assignment,
    ASTNode,
    BinaryOperation,
    Conditional,
    ContractDefinition,
    ContractKind,
    DataLocation,
    ElementaryTypeNameExpression,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    Expression,
    ExternalReferenceType,
    FunctionCall,
    FunctionCallKind,
    FunctionCallOptions,
    FunctionDefinition,
    FunctionKind,
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
    resolveAny,
    StateVariableVisibility,
    StructDefinition,
    TupleExpression,
    TypeName,
    UnaryOperation,
    UserDefinedValueTypeDefinition,
    VariableDeclaration,
    VariableDeclarationStatement
} from "../ast";
import { assert, eq, pp } from "../misc";
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
    FunctionType,
    ImportRefType,
    IntLiteralType,
    IntType,
    MappingType,
    ModifierType,
    PointerType,
    RationalLiteralType,
    StringLiteralKind,
    StringLiteralType,
    StringType,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "./ast";
import {
    type_Int,
    type_Interface,
    type_Contract,
    address06PayableBuiltins,
    address06Builtins,
    addressBuiltins,
    globalBuiltins
} from "./builtins";
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
    getFQDefName,
    binaryOperatorGroups,
    SolTypeError,
    specializeType,
    typeNameToTypeNode,
    variableDeclarationToTypeNode,
    decimalToRational
} from "./utils";
import { Decimal } from "decimal.js";
import { SuperType } from "./ast/super";
import { evalConstantExpr } from "./eval_const";
import { NumericLiteralType } from "./ast/numeric_literal";

export const unaryImpureOperators = ["++", "--"];

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
        assert(contract !== undefined, `this (${pp(node)}) used outside of a contract.`);

        return new PointerType(new UserDefinedType(contract.name, contract), DataLocation.Storage);
    }
};

const castableLocations: DataLocation[] = [DataLocation.Memory, DataLocation.Storage];

function funDefToType(def: FunctionDefinition): FunctionType {
    const paramTypes = def.vParameters.vParameters.map(variableDeclarationToTypeNode);
    const retTypes = def.vReturnParameters.vParameters.map(variableDeclarationToTypeNode);
    const isPublic =
        def.visibility === FunctionVisibility.External ||
        def.visibility === FunctionVisibility.Public;

    return new FunctionType(
        isPublic ? def.name : undefined,
        paramTypes,
        retTypes,
        def.visibility,
        def.stateMutability
    );
}

function eventDefToType(def: EventDefinition): EventType {
    const paramTypes = def.vParameters.vParameters.map(variableDeclarationToTypeNode);

    return new EventType(def.name, paramTypes);
}

function errDefToType(def: ErrorDefinition): ErrorType {
    const paramTypes = def.vParameters.vParameters.map(variableDeclarationToTypeNode);

    return new ErrorType(def.name, paramTypes);
}

export class InferType {
    constructor(public readonly version: string) {}

    /**
     * Infer the type of the assignment `node`. (In solidity assignments are expressions)
     */
    typeOfAssignment(node: Assignment): TypeNode {
        if (node.vLeftHandSide instanceof TupleExpression) {
            const rhsT = this.typeOf(node.vRightHandSide);

            assert(
                rhsT instanceof TupleType,
                `Unexpected non-tuple in rhs of tuple assignment {0}`,
                node
            );

            assert(
                rhsT.elements.length === node.vLeftHandSide.vOriginalComponents.length,
                `Unexpected mismatch between number of lhs tuple elements (${node.vLeftHandSide.vOriginalComponents.length}) and rhs tuple elements (${rhsT.elements.length}) in {0}`,
                node
            );

            const resTs: TypeNode[] = [];

            for (let i = 0; i < node.vLeftHandSide.vOriginalComponents.length; i++) {
                const lhsComp = node.vLeftHandSide.vOriginalComponents[i];

                if (lhsComp === null) {
                    resTs.push(rhsT.elements[i]);
                } else {
                    resTs.push(this.typeOf(lhsComp));
                }
            }

            return new TupleType(resTs);
        }

        return this.typeOf(node.vLeftHandSide);
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
                `Unexpected missing literals`
            );

            const aSmallestType = a.smallestFittingType();
            const bSmallestType = b.smallestFittingType();

            assert(
                aSmallestType !== undefined && bSmallestType !== undefined,
                `Couldn't find concrete types for {0} and {1}`,
                a,
                b
            );

            const signed = aSmallestType?.signed || bSmallestType?.signed;
            const nBits = Math.max(aSmallestType.nBits, bSmallestType.nBits);

            return new IntType(nBits, signed);
        }

        // If one of them is an int literal, and the other is not, we have 2 cases
        // 1) The literal fits in the int type - take the int type
        // 2) The literal doesn't fit in the int type - widen the int type.
        if (a instanceof IntLiteralType || b instanceof IntLiteralType) {
            const [literalT, concreteT] = (a instanceof IntLiteralType ? [a, b] : [b, a]) as [
                IntLiteralType,
                IntType
            ];

            assert(literalT.literal !== undefined, `TODO: Remove when we remove typestring parser`);
            const decMin = concreteT.min();
            const decMax = concreteT.max();

            /// Literal less than the minimum for the concrete type
            if (decMin > literalT.literal) {
                return this.inferCommonIntType(
                    new IntLiteralType(literalT.literal),
                    new IntLiteralType(decMax)
                );
            } else if (decMax < literalT.literal) {
                return this.inferCommonIntType(
                    new IntLiteralType(decMin),
                    new IntLiteralType(literalT.literal)
                );
            } else {
                /// Literal fits
                return concreteT;
            }
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
            castableLocations.includes(a.location) &&
            castableLocations.includes(b.location)
        ) {
            return new PointerType(a.to, DataLocation.Memory);
        }

        throw new SolTypeError(`Cannot infer commmon type for ${pp(a)} and ${pp(b)}`);
    }

    /**
     * Infer the type of the binary op `node`.
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
                `Unexpected result of const binary op`
            );

            return typeof res === "bigint"
                ? new IntLiteralType(res)
                : new RationalLiteralType(decimalToRational(res));
        }

        // After 0.6.0 the type of ** is just the type of the lhs
        if (node.operator === "**" && gte(this.version, "0.6.0")) {
            return a;
        }

        if (binaryOperatorGroups.Arithmetic.includes(node.operator)) {
            assert(
                a instanceof IntType || a instanceof IntLiteralType,
                `Unexpected type of {0}.`,
                a
            );
            assert(
                b instanceof IntType || b instanceof IntLiteralType,
                `Unexpected type of {0}.`,
                b
            );

            return this.inferCommonIntType(a, b);
        }

        // For bitshifts just take the type of the lhs
        // For all other bitwise operators the lhs and rhs must be the same, so we can just take the LHS
        if (binaryOperatorGroups.Bitwise.includes(node.operator)) {
            return a;
        }

        throw new Error(`NYI Binary op ${node.operator}`);
    }

    /**
     * Infer the type of the conditional `node`.
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
            `Unexpected node in Struct construction call ${callee.constructor.name}`
        );

        const calleeT = this.typeOf(callee);

        assert(
            calleeT instanceof TypeNameType &&
                calleeT.type instanceof UserDefinedType &&
                calleeT.type.definition instanceof StructDefinition,
            `Unexpected callee type ${pp(calleeT)}`
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

        if (node.vArguments.length === 1) {
            if (node.vArguments[0] instanceof Literal && lt(this.version, "0.8.0")) {
                return types.addressPayable;
            }

            const argT = this.typeOf(node.vArguments[0]);

            if (
                argT instanceof PointerType &&
                argT.to instanceof UserDefinedType &&
                argT.to.definition instanceof ContractDefinition
            ) {
                const contract = argT.to.definition;
                const fallbacks = contract.vFunctions.filter(
                    (funDef) =>
                        (funDef.kind === FunctionKind.Fallback ||
                            funDef.kind === FunctionKind.Receive) &&
                        funDef.stateMutability === FunctionStateMutability.Payable
                );

                if (fallbacks.length > 0) {
                    return types.addressPayable;
                }
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
            callee instanceof ElementaryTypeNameExpression ||
                callee instanceof IdentifierPath ||
                callee instanceof MemberAccess,
            `Unexpected node in type convertion call ${callee.constructor.name}`
        );

        const calleeT = this.typeOf(callee);

        if (!(calleeT instanceof TypeNameType)) {
            throw new SolTypeError(`Unexpected base type in type cast ${pp(calleeT)}`);
        }

        /// TODO(dimo): Test this! Is is possible for calleeT to be already specialized to Storage? Can this break things?
        const resT = specializeType(calleeT.type, DataLocation.Memory);

        if (resT instanceof AddressType) {
            return this.typeOfAddressCast(node, resT);
        }

        return resT;
    }

    /**
     * Infer the type of a call with a `new` expression as callee
     */
    typeOfNewCall(node: FunctionCall): TypeNode {
        const newExpr = node.vCallee;

        assert(newExpr instanceof NewExpression, `Unexpected vcall {0}`, newExpr);

        const typ = typeNameToTypeNode(newExpr.vTypeName);
        const loc =
            typ instanceof UserDefinedType && typ.definition instanceof ContractDefinition
                ? DataLocation.Storage
                : DataLocation.Memory;

        return specializeType(typ, loc);
    }

    private matchArguments(
        funs: FunctionDefinition[],
        args: Expression[]
    ): FunctionDefinition | undefined {
        const argTs: TypeNode[] = args.map((arg) => this.typeOf(arg));

        for (const funDef of funs) {
            const funT = funDefToType(funDef);

            if (funT.parameters.length !== argTs.length) {
                continue;
            }

            let argsMatch = true;
            for (let i = 0; i < funT.parameters.length; i++) {
                if (!castable(argTs[i], funT.parameters[i])) {
                    argsMatch = false;
                    break;
                }
            }

            if (argsMatch) {
                return funDef;
            }
        }

        return undefined;
    }
    /**
     * Infer the type of the function call `node`.
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

        const calleeT = this.typeOf(node.vCallee);
        let rets: TypeNode[];

        if (node.vFunctionCallType === ExternalReferenceType.Builtin) {
            if (!(calleeT instanceof BuiltinFunctionType || calleeT instanceof FunctionType)) {
                throw new SolTypeError(
                    `Unexpected builtin ${pp(node.vCallee)} in function call ${pp(node)}`
                );
            }

            const argTs = node.vArguments.map((arg) => this.typeOf(arg));
            const m: TypeSubstituion = new Map();
            buildSubstitutions(calleeT.parameters, argTs, m);

            rets = applySubstitutions(calleeT.returns, m);
        } else {
            if (calleeT instanceof FunctionType) {
                rets = calleeT.returns;
            } else if (calleeT instanceof EventType || calleeT instanceof ErrorType) {
                rets = [];
            } else if (calleeT instanceof FunctionLikeSetType) {
                if (calleeT.defs[0] instanceof EventDefinition) {
                    rets = [];
                } else {
                    // Match based on args. Needs castable.
                    const def = this.matchArguments(calleeT.defs, node.vArguments);

                    if (def === undefined) {
                        throw new SolTypeError(
                            `Couldn't resolve function ${node.vFunctionName} in ${pp(node)}`
                        );
                    }

                    rets = funDefToType(def).returns;
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
            const size: bigint | undefined =
                node.vIndexExpression &&
                node.vIndexExpression instanceof Literal &&
                node.vIndexExpression.kind === LiteralKind.Number
                    ? BigInt(node.vIndexExpression.value)
                    : undefined;

            /// TODO (dimo): Is there a case when we don't want to specialize the type? Or want to specialize to storage?
            return new TypeNameType(
                specializeType(new ArrayType(baseT.type, size), DataLocation.Memory)
            );
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

        /// TODO(dimo): This typing is not precise. We should add a special slice type as described
        /// in the documentation here https://docs.soliditylang.org/en/latest/types.html#array-slices
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
            `Unexpected use of builtin type ${pp(node)}`
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
            return applySubstitution(type_Int, new Map([["T", innerT]])) as BuiltinFunctionType;
        }

        if (innerT instanceof UserDefinedType && innerT.definition instanceof ContractDefinition) {
            const resTemplateT =
                innerT.definition.kind === ContractKind.Interface ? type_Interface : type_Contract;

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
            assert(contract !== undefined, `Use of super outside of contract in {0}`, node);
            return new SuperType(contract);
        }

        const globalBuiltin = globalBuiltins.getFieldForVersion(node.name, this.version);

        if (globalBuiltin) {
            return globalBuiltin;
        }

        if (!(node.name in builtinTypes)) {
            throw new Error(`NYI builtin ${node.name} for ${pp(node)}`);
        }

        return builtinTypes[node.name](node);
    }

    /**
     * Infer the type of the identifier `node`.
     */
    typeOfIdentifier(node: Identifier): TypeNode {
        const def = node.vReferencedDeclaration;

        if (def === undefined) {
            // Imported symbols also have undefined vReferencedDeclaration and
            // look like builtins. Disambiguate them here.
            if (
                node.parent instanceof ImportDirective &&
                // Sanity check that vSymbolAliases were built correctly
                node.parent.symbolAliases.length === node.parent.vSymbolAliases.length
            ) {
                const imp = node.parent;
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
                        return errDefToType(originalSym);
                    }

                    if (originalSym instanceof FunctionDefinition) {
                        return funDefToType(originalSym);
                    }

                    return variableDeclarationToTypeNode(originalSym);
                }
            }

            // If not an imported identifier must be a builtin
            return this.typeOfBuiltin(node);
        }

        if (def instanceof VariableDeclaration) {
            if (!def.vType && def.parent instanceof VariableDeclarationStatement) {
                /// In 0.4.x the TypeName on variable declarations may be omitted. Attempt to infer it from the RHS (if any)
                const varDeclStmt = def.parent;
                assert(
                    varDeclStmt.vInitialValue !== undefined,
                    `Initializer required when no type specified in {0}`,
                    varDeclStmt
                );

                const rhsT = this.typeOf(varDeclStmt.vInitialValue);
                let defInitT: TypeNode;

                if (varDeclStmt.assignments.length > 0) {
                    const tupleIdx = varDeclStmt.assignments.indexOf(def.id);

                    assert(
                        tupleIdx !== undefined,
                        `Var decl {0} not found in assignments of {1}`,
                        def,
                        varDeclStmt
                    );
                    assert(
                        rhsT instanceof TupleType && rhsT.elements.length > tupleIdx,
                        `Rhs not a tuple of right size in {0}`,
                        varDeclStmt
                    );

                    defInitT = rhsT.elements[tupleIdx];
                } else {
                    defInitT = rhsT;
                }

                if (defInitT instanceof IntLiteralType) {
                    const concreteT = defInitT.smallestFittingType();
                    assert(
                        concreteT !== undefined,
                        `RHS int literal type {0} doesn't fit in an int type`,
                        defInitT
                    );

                    defInitT = concreteT;
                }

                return defInitT;
            }

            return variableDeclarationToTypeNode(def);
        }

        if (
            def instanceof StructDefinition ||
            def instanceof ContractDefinition ||
            def instanceof EnumDefinition
        ) {
            const fqName =
                def.vScope instanceof ContractDefinition
                    ? `${def.vScope.name}.${def.name}`
                    : def.name;

            return new TypeNameType(new UserDefinedType(fqName, def));
        }

        if (def instanceof EventDefinition) {
            const argTs = def.vParameters.vParameters.map((paramDef) =>
                variableDeclarationToTypeNode(paramDef)
            );
            return new EventType(def.name, argTs);
        }

        if (def instanceof ModifierDefinition) {
            const argTs = def.vParameters.vParameters.map((paramDef) =>
                variableDeclarationToTypeNode(paramDef)
            );
            return new ModifierType(def.name, argTs);
        }

        if (def instanceof FunctionDefinition) {
            return funDefToType(def);
        }

        if (def instanceof ImportDirective) {
            return new ImportRefType(def);
        }

        if (def instanceof ErrorDefinition) {
            return errDefToType(def);
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
            let val = new Decimal(node.value);

            if (node.subdenomination !== undefined) {
                assert(
                    node.subdenomination in subdenominationMultipliers,
                    `Unknown subdenomination ${node.subdenomination}`
                );

                val = val.times(subdenominationMultipliers[node.subdenomination]);
            }

            if (val.isInteger()) {
                return new IntLiteralType(BigInt(val.toFixed()));
            }

            return new RationalLiteralType(decimalToRational(val));
        }

        if (node.kind === "string" || node.kind === "unicodeString" || node.kind === "hexString") {
            const [val, kind]: [string, StringLiteralKind] =
                node.kind === "hexString" || node.value === null
                    ? [node.hexValue, "hexString"]
                    : [node.value, node.kind];

            return new StringLiteralType(val, kind);
        }

        return types.bool;
    }

    typeOfMemberAccess(node: MemberAccess): TypeNode {
        const baseT = this.typeOf(node.vExpression);

        if (baseT instanceof PointerType) {
            const toT = baseT.to;

            /// Fields of structs
            if (toT instanceof UserDefinedType && toT.definition instanceof StructDefinition) {
                const fields = toT.definition.vMembers.filter(
                    (fieldDef) => fieldDef.name === node.memberName
                );

                if (fields.length !== 1) {
                    throw new SolTypeError(
                        `No field ${node.memberName} found on struct ${toT.definition.name} in ${pp(
                            node
                        )}`
                    );
                }

                assert(fields[0].vType !== undefined, ``);
                return specializeType(typeNameToTypeNode(fields[0].vType), baseT.location);
            }

            /// Fields on contract vars. Should always be a function
            if (toT instanceof UserDefinedType && toT.definition instanceof ContractDefinition) {
                const contract = toT.definition;
                const res = this.typeOfResolved(node.memberName, contract, true);

                if (res === undefined) {
                    throw new SolTypeError(
                        `No field ${node.memberName} found on contract ${contract.name} in ${pp(
                            node
                        )}`
                    );
                }

                return res;
            }

            if (toT instanceof ArrayType) {
                if (node.memberName === "length") {
                    return types.uint;
                }

                if (node.memberName === "push") {
                    return new BuiltinFunctionType(undefined, [toT.elementT], []);
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
                    assert(
                        node.parent instanceof FunctionCall,
                        `Unexpected concat builtin not in a function call {0}`,
                        node
                    );

                    const argTs = node.parent.vArguments.map((arg) => this.typeOf(arg));

                    for (const argT of argTs) {
                        if (!(argT instanceof PointerType && eq(argT.to, baseT.type))) {
                            throw new SolTypeError(
                                `Unexpected arguments to concat in ${pp(node.parent)}`
                            );
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
                assert(
                    node.parent instanceof FunctionCall &&
                        node.parent.vArguments.length === 2 &&
                        node.parent.vArguments[1] instanceof TupleExpression,
                    `Unexpected use of abi.decode outside a function call {0}`,
                    node.parent
                );

                const retTs: TypeNode[] = [];

                for (const typeExpr of (node.parent.vArguments[1] as TupleExpression).vComponents) {
                    const componentT = this.typeOf(typeExpr);

                    assert(
                        componentT instanceof TypeNameType,
                        `Expected type in abi.decode not {0}`,
                        componentT
                    );

                    retTs.push(componentT.type);
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

            if (node.memberName === "address") {
                return types.address;
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
            for (const contract of baseT.contract.vLinearizedBaseContracts.slice(1)) {
                const res = this.typeOfResolved(node.memberName, contract, false);

                if (res && (res instanceof FunctionType || res instanceof FunctionLikeSetType)) {
                    return res;
                }
            }
        }

        throw new SolTypeError(
            `Unknown field ${node.memberName} on ${pp(node)} of type ${pp(baseT)}`
        );
    }

    typeOfNewExpression(newExpr: NewExpression): TypeNode {
        assert(newExpr instanceof NewExpression, `Unexpected vcall {0}`, newExpr);

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
            const constrType = funDefToType(typ.definition.vConstructor);
            constrType.returns.push(resT);
            return constrType;
        }

        /// Builtin constructor/array creation case
        const argTs = typ instanceof ArrayType ? [types.uint] : [];
        return new BuiltinFunctionType(undefined, argTs, [resT]);
    }

    typeOfTupleExpression(node: TupleExpression): TypeNode {
        const componentTs = node.vComponents.map((cmp) => this.typeOf(cmp));

        if (node.isInlineArray) {
            assert(node.vComponents.length > 0, `Can't have an array initialize`);
            const elT = componentTs.reduce((prev, cur) => this.inferCommonType(prev, cur));

            return new PointerType(
                new ArrayType(elT, BigInt(node.components.length)),
                DataLocation.Memory
            );
        }

        return componentTs.length != 1 ? new TupleType(componentTs) : componentTs[0];
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
                `Unexpected result of const binary op`
            );

            return typeof res === "bigint"
                ? new IntLiteralType(res)
                : new RationalLiteralType(decimalToRational(res));
        }

        if (node.operator === "-" || node.operator === "~") {
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
    typeOfResolved(name: string, ctx: ASTNode, externalOnly: boolean): TypeNode | undefined {
        const defs: AnyResolvable[] = [...resolveAny(name, ctx, this.version, true)];

        if (defs.length === 0) {
            return undefined;
        }

        const funs = defs.filter(
            (def) =>
                def instanceof FunctionDefinition &&
                (!externalOnly || // Only external/public functions visible on lookups on contract pointers
                    def.visibility === FunctionVisibility.External ||
                    def.visibility === FunctionVisibility.Public)
        ) as FunctionDefinition[];

        const getters = defs.filter(
            (def) =>
                def instanceof VariableDeclaration &&
                (!externalOnly || def.visibility === StateVariableVisibility.Public) // Only public vars are visible on lookups on contract pointers.
        ) as VariableDeclaration[];

        const typeDefs = defs.filter(
            (def) =>
                !externalOnly && // Type Defs are not visible on lookups on contract pointers.
                (def instanceof StructDefinition ||
                    def instanceof EnumDefinition ||
                    def instanceof ContractDefinition)
        ) as Array<StructDefinition | EnumDefinition | ContractDefinition>;

        const eventDefs = defs.filter(
            (def) => !externalOnly && def instanceof EventDefinition
        ) as EventDefinition[];

        const errorDefs = defs.filter(
            (def) => !externalOnly && def instanceof ErrorDefinition
        ) as ErrorDefinition[];

        if (funs.length > 0) {
            assert(
                funs.length === defs.length,
                `Unexpected both functions and others matching {0} in {1}`,
                name,
                ctx
            );

            if (funs.length === 1) {
                const res = funDefToType(funs[0]);
                res.visibility === FunctionVisibility.External;
                return res;
            }

            return new FunctionLikeSetType(funs);
        }

        if (getters.length > 0) {
            assert(
                getters.length === defs.length,
                `Unexpected both getters and others matching {0} in {1}`,
                name,
                ctx
            );
            assert(getters.length === 1, `Unexpected overloading between getters for {0}`, name);

            return externalOnly
                ? getters[0].getterFunType()
                : variableDeclarationToTypeNode(getters[0]);
        }

        if (errorDefs.length > 0) {
            assert(
                errorDefs.length === defs.length,
                `Unexpected both getters and others matching {0} in {1}`,
                name,
                ctx
            );
            assert(
                errorDefs.length === 1,
                `Unexpected overloading between errorDefs for {0}`,
                name
            );

            return errDefToType(errorDefs[0]);
        }

        if (eventDefs.length > 0) {
            assert(
                eventDefs.length === defs.length,
                `Unexpected both events and others matching {0} in {1}`,
                name,
                ctx
            );

            if (eventDefs.length === 1) {
                return eventDefToType(eventDefs[0]);
            }

            return new FunctionLikeSetType(eventDefs);
        }

        assert(typeDefs.length == 1, `Unexpected number of type defs {0}`, name);

        const def = typeDefs[0];
        const fqName =
            def.vScope instanceof ContractDefinition ? `${def.vScope.name}.${def.name}` : def.name;
        return new TypeNameType(new UserDefinedType(fqName, typeDefs[0]));
    }
}
