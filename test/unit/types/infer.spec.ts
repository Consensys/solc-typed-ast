import expect from "expect";
import {
    ASTKind,
    ASTReader,
    BinaryOperation,
    CompilerKind,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    compileSol,
    ContractDefinition,
    DataLocation,
    detectCompileErrors,
    eq,
    EventDefinition,
    Expression,
    FunctionCall,
    FunctionCallOptions,
    Identifier,
    Literal,
    MemberAccess,
    ModifierInvocation,
    NewExpression,
    pp,
    StructDefinition,
    UnaryOperation
} from "../../../src";
import {
    BuiltinFunctionType,
    BuiltinStructType,
    BuiltinType,
    ErrorType,
    EventType,
    FunctionType,
    ImportRefType,
    InferType,
    IntLiteralType,
    ModuleType,
    PackedArrayType,
    parse,
    PointerType,
    RationalLiteralType,
    StringLiteralType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "../../../src/types";

const samples: Array<[string, string, ASTKind]> = [
    [
        "./test/samples/solidity/compile_04.sol",
        CompilerVersions04[CompilerVersions04.length - 1],
        ASTKind.Legacy
    ],
    [
        "./test/samples/solidity/compile_05.sol",
        CompilerVersions05[CompilerVersions05.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_06.sol",
        CompilerVersions06[CompilerVersions06.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_07.sol",
        CompilerVersions07[CompilerVersions07.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_08.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/resolving_08.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/block_04.sol",
        CompilerVersions04[CompilerVersions04.length - 1],
        ASTKind.Legacy
    ],
    [
        "./test/samples/solidity/resolving/block_05.sol",
        CompilerVersions05[CompilerVersions05.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/imports_and_source_unit_function_overloading.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/inheritance_and_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/shadowing_overloading_and_overriding.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/simple_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/types/types.sol",
        CompilerVersions06[CompilerVersions06.length - 1],
        ASTKind.Modern
    ]
];

/**
 * This function compares an inferred type (`inferredT`) to the type parsed from
 * a typeString (`fromString`) for a given expression `expr`
 *
 * There are several known cases where we diverge from typeString, that are documented
 * in this function.
 */
function compareTypeNodes(inferredT: TypeNode, fromString: TypeNode, expr: Expression): boolean {
    // For names of a struct S we will infer type(struct S) while the typestring will be type(struct S storage pointer)
    // Our approach seems fine for now, as the name of the struct itself is not really a pointer.
    if (
        inferredT instanceof TypeNameType &&
        ((inferredT.type instanceof UserDefinedType &&
            inferredT.type.definition instanceof StructDefinition) ||
            inferredT.type instanceof PackedArrayType) &&
        fromString instanceof TypeNameType &&
        fromString.type instanceof PointerType &&
        eq(inferredT.type, fromString.type.to)
    ) {
        return true;
    }

    /// For builtin functions we are more precise than typeStrings.  So for
    /// those just check that the node is a builtin reference and that the
    /// parameters of the function types match up.
    if (
        inferredT instanceof BuiltinFunctionType &&
        fromString instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        !expr.vReferencedDeclaration &&
        (eq(inferredT.parameters, fromString.parameters) ||
            (inferredT.name === "decode" && fromString.parameters.length === 0))
    ) {
        return true;
    }

    // Furthermore even for some builtin functions the parameters don't match up.
    // For example for `abi.decode(...)` the typeString is `function () pure`...
    if (
        inferredT instanceof BuiltinFunctionType &&
        fromString instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        !expr.vReferencedDeclaration &&
        inferredT.name === "decode" &&
        fromString.parameters.length === 0
    ) {
        return true;
    }

    /// For events we are more precise than typeStrings.  So for
    /// those just check that the node is a builtin reference and that the
    /// parameters of the function types match up
    if (
        inferredT instanceof EventType &&
        fromString instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        expr.vReferencedDeclaration instanceof EventDefinition &&
        eq(inferredT.parameters, fromString.parameters)
    ) {
        return true;
    }

    /// We treat `this` as a pointer ("contract C storage:"), but the typeString is not a pointer (just "contract C")
    if (
        inferredT instanceof PointerType &&
        inferredT.location === DataLocation.Storage &&
        inferredT.to instanceof UserDefinedType &&
        expr instanceof Identifier &&
        expr.name === "this" &&
        eq(inferredT.to, fromString)
    ) {
        return true;
    }

    /// For the builtin `type(T)` calls we infer a builtin struct. The
    /// typeString is just a TypeNameType (TODO: this check is imprecise)
    if (
        expr instanceof FunctionCall &&
        expr.vFunctionName === "type" &&
        inferredT instanceof BuiltinStructType
    ) {
        return true;
    }

    /// For the `type` identifier we infer a builtin function from TypeNames to
    /// the specific builtin struct.  The typeStrings is just a pure function
    /// with no args.
    if (
        expr instanceof Identifier &&
        expr.name === "type" &&
        !expr.vReferencedDeclaration &&
        inferredT instanceof BuiltinFunctionType &&
        inferredT.name === "type"
    ) {
        return true;
    }

    /// For large int literals/constant expressions we are more precise than the typeStrings
    if (
        (expr instanceof Literal ||
            expr instanceof UnaryOperation ||
            expr instanceof BinaryOperation) &&
        expr.typeString.includes("digits omitted") &&
        inferredT instanceof IntLiteralType
    ) {
        return true;
    }

    /// For builtin struct identifiers abi,tx,block and msg we also differ from the typeString parser
    if (
        inferredT instanceof BuiltinStructType &&
        fromString instanceof BuiltinType &&
        inferredT.name === fromString.name
    ) {
        return true;
    }

    // For some expressions of type pointer contract the typestring is just a contract. Accept
    // This mismatch.
    if (
        inferredT instanceof PointerType &&
        inferredT.location === DataLocation.Storage &&
        inferredT.to instanceof UserDefinedType &&
        inferredT.to.definition instanceof ContractDefinition &&
        eq(inferredT.to, fromString)
    ) {
        return true;
    }

    // We infer the type of NewExpression for contracts to be a builtin function from constructor args to a new storage pointer to contract.
    // The typeString returns just a `contract Foo` without a pointer.
    if (
        expr instanceof NewExpression &&
        (inferredT instanceof BuiltinFunctionType || inferredT instanceof FunctionType) &&
        fromString instanceof FunctionType &&
        eq(inferredT.parameters, fromString.parameters) &&
        inferredT.returns.length === 1 &&
        fromString.returns.length === 1 &&
        inferredT.returns[0] instanceof PointerType &&
        inferredT.returns[0].to instanceof UserDefinedType &&
        inferredT.returns[0].to.definition instanceof ContractDefinition &&
        eq(inferredT.returns[0].to, fromString.returns[0])
    ) {
        return true;
    }

    /// For all other NewExpressions we expect the args/returns to match
    if (
        expr instanceof NewExpression &&
        inferredT instanceof BuiltinFunctionType &&
        fromString instanceof FunctionType &&
        eq(inferredT.parameters, fromString.parameters) &&
        eq(inferredT.returns, fromString.returns)
    ) {
        return true;
    }

    /// Function types for functions may differ slightly from the type string (e.g missing name/visiblity in typestring)
    /// So just compare param/return types
    if (
        inferredT instanceof FunctionType &&
        fromString instanceof FunctionType &&
        eq(inferredT.parameters, fromString.parameters) &&
        eq(inferredT.returns, fromString.returns)
    ) {
        return true;
    }

    /// In some versions hex strings have kind 'string' in the AST, but 'hex' in the typeString parser
    if (
        inferredT instanceof StringLiteralType &&
        fromString instanceof StringLiteralType &&
        inferredT.kind !== "hexString" &&
        fromString.kind === "hexString" &&
        Buffer.from(inferredT.literal).toString("hex") === fromString.literal
    ) {
        return true;
    }

    // Skip comparing types for abi.*, msg.*, block.* etc..
    if (
        inferredT instanceof BuiltinFunctionType &&
        expr instanceof MemberAccess &&
        expr.memberName === inferredT.name &&
        expr.vExpression instanceof Identifier &&
        ["abi", "msg", "block"].includes(expr.vExpression.name)
    ) {
        return true;
    }

    /// For imports we use the slightly ritcher ImportRefType while
    /// the string parser returns the simpler ModuleType. ModuleType should
    /// be considered deprecated
    if (
        inferredT instanceof ImportRefType &&
        fromString instanceof ModuleType &&
        inferredT.importStmt.absolutePath === fromString.path
    ) {
        return true;
    }

    /// We differ in the arguments for the concat builtin
    if (
        inferredT instanceof BuiltinFunctionType &&
        inferredT.name === "concat" &&
        fromString instanceof FunctionType &&
        eq(inferredT.returns, fromString.returns) &&
        fromString.parameters.length === 0
    ) {
        return true;
    }

    /// We have a custom ErrorType for errors. Typestring treat them as pure functions
    if (
        inferredT instanceof ErrorType &&
        fromString instanceof FunctionType &&
        eq(inferredT.parameters, fromString.parameters) &&
        fromString.returns.length === 0
    ) {
        return true;
    }

    /// TODO: Remove after fixing TODOs in IntLiteralType
    if (
        inferredT instanceof IntLiteralType &&
        fromString instanceof RationalLiteralType &&
        inferredT.pp() === fromString.pp()
    ) {
        return true;
    }

    /// Otherwise the types must match up exactly
    const res = eq(inferredT, fromString);

    if (!res) {
        if (inferredT instanceof IntLiteralType) {
            console.error(`Inferred literal: ${inferredT.literal}`);
        }

        if (fromString instanceof IntLiteralType) {
            console.error(`Inferred literal: ${fromString.literal}`);
        }

        console.error(
            `Diff: Inferred: "${inferredT.pp()}" typeString: "${fromString.pp()}" for node ${pp(
                expr
            )}`
        );
    }

    return res;
}

describe("Type inference for expressions", () => {
    for (const [sample, compilerVersion, astKind] of samples) {
        for (const compilerKind of [CompilerKind.Native]) {
            it(`[${compilerKind}] ${sample}`, async () => {
                const result = await compileSol(
                    sample,
                    "auto",
                    undefined,
                    undefined,
                    undefined,
                    compilerKind as CompilerKind
                );

                expect(result.compilerVersion).toEqual(compilerVersion);
                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                const data = result.data;

                const reader = new ASTReader();
                const sourceUnits = reader.read(data, astKind);

                const infer = new InferType(compilerVersion);

                for (const unit of sourceUnits) {
                    for (const node of unit.getChildrenBySelector(
                        (child) => child instanceof Expression
                    )) {
                        const expr = node as Expression;

                        const inferredType = infer.typeOf(expr);

                        // typeStrings for Identifiers in ImportDirectives may be undefined.
                        if (expr.typeString === undefined) {
                            continue;
                        }

                        // Skip modifier invocations
                        if (expr.parent instanceof ModifierInvocation) {
                            continue;
                        }

                        // Skip call options - we don't compute types for them
                        if (expr instanceof FunctionCallOptions) {
                            continue;
                        }

                        const expectedType = parse(expr.typeString, {
                            ctx: expr,
                            version: compilerVersion
                        });

                        expect(compareTypeNodes(inferredType, expectedType, expr)).toBeTruthy();
                    }
                }
            });
        }
    }
});
