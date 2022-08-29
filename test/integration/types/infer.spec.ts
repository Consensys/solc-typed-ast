import expect from "expect";
import {
    assert,
    Assignment,
    ASTKind,
    ASTReader,
    ASTWriter,
    BinaryOperation,
    CompilerKind,
    compileSol,
    ContractDefinition,
    DefaultASTWriterMapping,
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
    PossibleCompilerKinds,
    PrettyFormatter,
    StructDefinition,
    TupleExpression,
    UnaryOperation
} from "../../../src";
import {
    BuiltinFunctionType,
    BuiltinStructType,
    BuiltinType,
    ErrorType,
    EventType,
    FunctionLikeSetType,
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
    SyntaxError,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "../../../src/types";
import { SuperType } from "../../../src/types/ast/super";

const samples: Array<[string, ASTKind]> = [
    ["./test/samples/solidity/compile_04.sol", ASTKind.Legacy],
    ["./test/samples/solidity/compile_05.sol", ASTKind.Modern],
    ["./test/samples/solidity/latest_06.sol", ASTKind.Modern],
    ["./test/samples/solidity/latest_07.sol", ASTKind.Modern],
    ["./test/samples/solidity/latest_08.sol", ASTKind.Modern],
    ["./test/samples/solidity/resolving/resolving_08.sol", ASTKind.Modern],
    ["./test/samples/solidity/resolving/block_04.sol", ASTKind.Legacy],
    ["./test/samples/solidity/resolving/block_05.sol", ASTKind.Modern],
    [
        "./test/samples/solidity/resolving/imports_and_source_unit_function_overloading.sol",
        ASTKind.Modern
    ],
    ["./test/samples/solidity/resolving/inheritance_and_shadowing.sol", ASTKind.Modern],
    ["./test/samples/solidity/resolving/shadowing_overloading_and_overriding.sol", ASTKind.Modern],
    ["./test/samples/solidity/resolving/simple_shadowing.sol", ASTKind.Modern],
    ["./test/samples/solidity/types/types.sol", ASTKind.Modern],
    /// Added with grep
    ["test/samples/solidity/struct_docs_05.sol", ASTKind.Modern],
    ["test/samples/solidity/node.sol", ASTKind.Modern],
    ["test/samples/solidity/declarations/interface_060.sol", ASTKind.Modern],
    ["test/samples/solidity/resolving/boo.sol", ASTKind.Modern],
    ["test/samples/solidity/resolving/struct_assignments.sol", ASTKind.Modern],
    ["test/samples/solidity/resolving/foo.sol", ASTKind.Modern],
    ["test/samples/solidity/resolving/id_paths.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/do_while_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/expression_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/while_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/placeholder_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/emit_0421.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/variable_declaration_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/throw_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/while_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/emit_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/inline_assembly_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/if_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/expression_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/block_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/for_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/return_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/placeholder_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/inline_assembly_060.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/for_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/inline_assembly_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/return_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/block_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/do_while_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/variable_declaration_050.sol", ASTKind.Modern],
    ["test/samples/solidity/statements/if_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/getters_08.sol", ASTKind.Modern],
    ["test/samples/solidity/dispatch_05.sol", ASTKind.Modern],
    ["test/samples/solidity/looks_same_075.sol", ASTKind.Modern],
    ["test/samples/solidity/compile_06.sol", ASTKind.Modern],
    ["test/samples/solidity/getters_07_abiv1.sol", ASTKind.Modern],
    ["test/samples/solidity/struct_docs_04.sol", ASTKind.Modern],
    ["test/samples/solidity/signatures.sol", ASTKind.Modern],
    ["test/samples/solidity/getters_07.sol", ASTKind.Modern],
    ["test/samples/solidity/source_map.sol", ASTKind.Modern],
    ["test/samples/solidity/latest_imports_08.sol", ASTKind.Modern],
    ["test/samples/solidity/issue_132_fun_kind.sol", ASTKind.Modern],
    ["test/samples/solidity/selectors.sol", ASTKind.Modern],
    ["test/samples/solidity/meta/complex_imports/c.sol", ASTKind.Modern],
    ["test/samples/solidity/meta/pragma.sol", ASTKind.Modern],
    ["test/samples/solidity/writer_edge_cases.sol", ASTKind.Modern],
    ["test/samples/solidity/reports/B.sol", ASTKind.Modern],
    ["test/samples/solidity/reports/A.sol", ASTKind.Modern],
    ["test/samples/solidity/looks_same_075.sourced.sm.sol", ASTKind.Modern],
    ["test/samples/solidity/expressions/conditional_050.sol", ASTKind.Modern],
    ["test/samples/solidity/expressions/conditional_0413.sol", ASTKind.Modern],
    ["test/samples/solidity/super.sol", ASTKind.Modern],
    ["test/samples/solidity/constant_expressions.sol", ASTKind.Modern],
    ["test/samples/solidity/decoding_test.sol", ASTKind.Modern],
    ["test/samples/solidity/ops.sol", ASTKind.Modern],
    ["test/samples/solidity/builtins_0426.sol", ASTKind.Legacy],
    ["test/samples/solidity/builtins_0426.sol", ASTKind.Modern],
    ["test/samples/solidity/builtins_0816.sol", ASTKind.Modern]
];

function toSoliditySource(expr: Expression, compilerVersion: string) {
    const writer = new ASTWriter(DefaultASTWriterMapping, new PrettyFormatter(4), compilerVersion);

    return writer.write(expr);
}

/**
 * This function compares an inferred type (`inferredT`) to the type parsed from
 * a typeString (`parsedT`) for a given expression `expr`
 *
 * There are several known cases where we diverge from typeString, that are documented
 * in this function.
 */
function compareTypeNodes(inferredT: TypeNode, parsedT: TypeNode, expr: Expression): boolean {
    // For names of a struct S we will infer type(struct S) while the typestring will be type(struct S storage pointer)
    // Our approach seems fine for now, as the name of the struct itself is not really a pointer.
    if (
        inferredT instanceof TypeNameType &&
        ((inferredT.type instanceof UserDefinedType &&
            inferredT.type.definition instanceof StructDefinition) ||
            inferredT.type instanceof PackedArrayType) &&
        parsedT instanceof TypeNameType &&
        parsedT.type instanceof PointerType &&
        eq(inferredT.type, parsedT.type.to)
    ) {
        return true;
    }

    /// For builtin functions we are more precise than typeStrings. So for
    /// those just check that the node is a builtin reference and that the
    /// parameters of the function types match up.
    if (
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        !expr.vReferencedDeclaration &&
        (eq(inferredT.parameters, parsedT.parameters) ||
            (parsedT.parameters.length === 0 &&
                (inferredT.name === "decode" ||
                    inferredT.name === "call" ||
                    inferredT.name === "callcode" ||
                    inferredT.name === "delegatecall" ||
                    inferredT.name === "staticcall" ||
                    inferredT.name === "keccak256" ||
                    inferredT.name === "sha3" ||
                    inferredT.name === "sha256" ||
                    inferredT.name === "ripemd160")) ||
            inferredT.name === "addmod" ||
            inferredT.name === "mulmod" ||
            inferredT.name === "ecrecover")
    ) {
        return true;
    }

    // Furthermore even for some builtin functions the parameters don't match up.
    // For example for `abi.decode(...)` the typeString is `function () pure`...
    if (
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        !expr.vReferencedDeclaration &&
        inferredT.name === "decode" &&
        parsedT.parameters.length === 0
    ) {
        return true;
    }

    /// For events we are more precise than typeStrings.  So for
    /// those just check that the node is a builtin reference and that the
    /// parameters of the function types match up
    if (
        inferredT instanceof EventType &&
        parsedT instanceof FunctionType &&
        (expr instanceof Identifier || expr instanceof MemberAccess) &&
        expr.vReferencedDeclaration instanceof EventDefinition &&
        eq(inferredT.parameters, parsedT.parameters)
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
            expr instanceof BinaryOperation ||
            expr instanceof TupleExpression) &&
        expr.typeString.includes("digits omitted") &&
        inferredT instanceof IntLiteralType
    ) {
        return true;
    }

    /// For builtin struct identifiers abi, tx, block and msg we also differ from the typeString parser
    if (
        inferredT instanceof BuiltinStructType &&
        parsedT instanceof BuiltinType &&
        inferredT.name === parsedT.name
    ) {
        return true;
    }

    /// For all other NewExpressions we expect the args/returns to match
    if (
        expr instanceof NewExpression &&
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        eq(inferredT.parameters, parsedT.parameters) &&
        eq(inferredT.returns, parsedT.returns)
    ) {
        return true;
    }

    /// Function types for functions may differ slightly from the type string (e.g missing name/visiblity in typestring)
    /// So just compare param/return types
    if (
        inferredT instanceof FunctionType &&
        parsedT instanceof FunctionType &&
        eq(inferredT.parameters, parsedT.parameters) &&
        eq(inferredT.returns, parsedT.returns)
    ) {
        return true;
    }

    /// In some versions hex strings have kind 'string' in the AST, but 'hex' in the typeString parser
    if (
        inferredT instanceof StringLiteralType &&
        parsedT instanceof StringLiteralType &&
        inferredT.kind !== "hexString" &&
        parsedT.kind === "hexString" &&
        Buffer.from(inferredT.literal).toString("hex") === parsedT.literal
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

    /// For imports we use the slightly richer ImportRefType while
    /// the string parser returns the simpler ModuleType. ModuleType should
    /// be considered deprecated
    if (
        inferredT instanceof ImportRefType &&
        parsedT instanceof ModuleType &&
        inferredT.importStmt.absolutePath === parsedT.path
    ) {
        return true;
    }

    /// We differ in the arguments for the concat builtin
    if (
        inferredT instanceof BuiltinFunctionType &&
        inferredT.name === "concat" &&
        parsedT instanceof FunctionType &&
        eq(inferredT.returns, parsedT.returns) &&
        parsedT.parameters.length === 0
    ) {
        return true;
    }

    /// We have a custom ErrorType for errors. typeString treat them as pure functions
    if (
        inferredT instanceof ErrorType &&
        parsedT instanceof FunctionType &&
        eq(inferredT.parameters, parsedT.parameters) &&
        parsedT.returns.length === 0
    ) {
        return true;
    }

    /// TODO: Remove after fixing TODOs in IntLiteralType
    if (
        inferredT instanceof IntLiteralType &&
        parsedT instanceof RationalLiteralType &&
        inferredT.pp() === parsedT.pp()
    ) {
        return true;
    }

    /// For tuple assignments we infer a full tuple type, but the typestring is just an empty tuple
    if (
        expr instanceof Assignment &&
        inferredT instanceof TupleType &&
        parsedT instanceof TupleType &&
        parsedT.elements.length === 0
    ) {
        return true;
    }

    /// For literal strings with invalid utf-8 sequences we infer a hex string with precise literal.
    /// typeString contains error message.
    if (
        inferredT instanceof StringLiteralType &&
        inferredT.kind === "hexString" &&
        parsedT instanceof StringLiteralType &&
        parsedT.literal.includes("contains invalid UTF-8 sequence at position")
    ) {
        return true;
    }

    /// For the `super` keyword we have a special type that makes it easier to typecheck
    /// Member accesses `super.fn` in the case of multiple inheritance
    if (
        inferredT instanceof SuperType &&
        ((parsedT instanceof UserDefinedType && parsedT.definition instanceof ContractDefinition) ||
            (parsedT instanceof TypeNameType &&
                parsedT.type instanceof UserDefinedType &&
                parsedT.type.definition instanceof ContractDefinition))
    ) {
        return true;
    }

    // For overloaded function identifiers we infer a function set, while the typestring is a concrete resolved function
    if (inferredT instanceof FunctionLikeSetType && parsedT instanceof FunctionType) {
        return true;
    }

    // We currently use a hacky approach to deal with rational literals that may end up with non-reduced fractions.
    // For now ignore these issues.
    // TODO: Remove this if after re-writing the eval_consts.ts file to something sane.
    if (
        inferredT instanceof RationalLiteralType &&
        parsedT instanceof RationalLiteralType &&
        inferredT.literal.denominator % parsedT.literal.denominator === BigInt(0) &&
        parsedT.literal.numerator *
            (inferredT.literal.denominator / parsedT.literal.denominator) ===
            inferredT.literal.numerator
    ) {
        return true;
    }

    /// Otherwise the types must match up exactly
    return eq(inferredT, parsedT);
}

describe("Type inference for expressions", () => {
    for (const [sample, astKind] of samples) {
        for (const compilerKind of PossibleCompilerKinds) {
            it(`[${compilerKind}] ${sample}`, async () => {
                const result = await compileSol(
                    sample,
                    "auto",
                    undefined,
                    undefined,
                    undefined,
                    compilerKind as CompilerKind
                );

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                const { data, compilerVersion } = result;

                assert(
                    compilerVersion !== undefined,
                    "Expected compiler version to be set to precise"
                );

                const reader = new ASTReader();
                const sourceUnits = reader.read(data, astKind);

                const infer = new InferType(compilerVersion);

                for (const unit of sourceUnits) {
                    for (const expr of unit.getChildrenBySelector<Expression>(
                        (child) => child instanceof Expression
                    )) {
                        const inferredType = infer.typeOf(expr);

                        // typeStrings for Identifiers in ImportDirectives may be undefined.
                        if (expr.typeString === undefined) {
                            continue;
                        }

                        // Skip nodes with broken typeStrings in legacy compilers
                        if (expr.typeString === null) {
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

                        let parsedType: TypeNode;

                        try {
                            parsedType = parse(expr.typeString, {
                                ctx: expr,
                                version: compilerVersion
                            });
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                // Failed parsing. Skip
                                continue;
                            }

                            throw e;
                        }

                        assert(
                            compareTypeNodes(inferredType, parsedType, expr),
                            `Mismatch inferred type "{0}" and parsed type "{1}" (typeString "{2}") for expression {3} -> {4}`,
                            inferredType,
                            parsedType,
                            expr.typeString,
                            expr,
                            toSoliditySource(expr, compilerVersion)
                        );
                    }
                }
            });
        }
    }
});
