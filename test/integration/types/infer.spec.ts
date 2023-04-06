import expect from "expect";
import fse from "fs-extra";
import { join } from "path";
import { gte, lt } from "semver";
import {
    assert,
    Assignment,
    ASTKind,
    ASTReader,
    ASTWriter,
    BinaryOperation,
    CompileResult,
    CompilerKind,
    CompilerVersions,
    compileSol,
    ContractDefinition,
    DataLocation,
    DefaultASTWriterMapping,
    detectCompileErrors,
    eq,
    EventDefinition,
    Expression,
    ExternalReferenceType,
    FunctionCall,
    FunctionCallKind,
    FunctionCallOptions,
    FunctionVisibility,
    Identifier,
    Literal,
    MemberAccess,
    ModifierInvocation,
    NewExpression,
    PrettyFormatter,
    StructDefinition,
    TupleExpression,
    UnaryOperation,
    VariableDeclaration
} from "../../../src";
import {
    ArrayType,
    BuiltinFunctionType,
    BuiltinStructType,
    BuiltinType,
    castable,
    ErrorType,
    EventType,
    FunctionLikeSetType,
    FunctionType,
    generalizeType,
    ImportRefType,
    InferType,
    IntLiteralType,
    IntType,
    isVisiblityExternallyCallable,
    PackedArrayType,
    PointerType,
    RationalLiteralType,
    StringLiteralType,
    SuperType,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "../../../src/types";
import { ModuleType } from "../../utils/typeStrings/ast/module_type";
import { parse, PeggySyntaxError } from "../../utils/typeStrings/typeString_parser";

export const samples: string[] = [
    "./test/samples/solidity/compile_04.sol",
    "./test/samples/solidity/compile_05.sol",
    "./test/samples/solidity/latest_06.sol",
    "./test/samples/solidity/latest_07.sol",
    "./test/samples/solidity/latest_08.sol",
    "./test/samples/solidity/resolving/resolving_08.sol",
    "./test/samples/solidity/resolving/block_04.sol",
    "./test/samples/solidity/resolving/block_05.sol",
    "./test/samples/solidity/resolving/imports_and_source_unit_function_overloading.sol",
    "./test/samples/solidity/resolving/inheritance_and_shadowing.sol",
    "./test/samples/solidity/resolving/shadowing_overloading_and_overriding.sol",
    "./test/samples/solidity/resolving/simple_shadowing.sol",
    "./test/samples/solidity/types/types.sol",
    /// Added with grep
    "test/samples/solidity/struct_docs_05.sol",
    "test/samples/solidity/node.sol",
    "test/samples/solidity/declarations/interface_060.sol",
    "test/samples/solidity/resolving/boo.sol",
    "test/samples/solidity/resolving/struct_assignments.sol",
    "test/samples/solidity/resolving/foo.sol",
    "test/samples/solidity/resolving/id_paths.sol",
    "test/samples/solidity/statements/do_while_0413.sol",
    "test/samples/solidity/statements/expression_050.sol",
    "test/samples/solidity/statements/while_0413.sol",
    "test/samples/solidity/statements/placeholder_0413.sol",
    "test/samples/solidity/statements/emit_0421.sol",
    "test/samples/solidity/statements/variable_declaration_0413.sol",
    "test/samples/solidity/statements/throw_0413.sol",
    "test/samples/solidity/statements/while_050.sol",
    "test/samples/solidity/statements/emit_050.sol",
    "test/samples/solidity/statements/inline_assembly_050.sol",
    "test/samples/solidity/statements/if_050.sol",
    "test/samples/solidity/statements/expression_0413.sol",
    "test/samples/solidity/statements/block_050.sol",
    "test/samples/solidity/statements/for_050.sol",
    "test/samples/solidity/statements/return_050.sol",
    "test/samples/solidity/statements/placeholder_050.sol",
    "test/samples/solidity/statements/inline_assembly_060.sol",
    "test/samples/solidity/statements/for_0413.sol",
    "test/samples/solidity/statements/inline_assembly_0413.sol",
    "test/samples/solidity/statements/return_0413.sol",
    "test/samples/solidity/statements/block_0413.sol",
    "test/samples/solidity/statements/do_while_050.sol",
    "test/samples/solidity/statements/variable_declaration_050.sol",
    "test/samples/solidity/statements/if_0413.sol",
    "test/samples/solidity/getters_08.sol",
    "test/samples/solidity/dispatch_05.sol",
    "test/samples/solidity/looks_same_075.sol",
    "test/samples/solidity/compile_06.sol",
    "test/samples/solidity/getters_07_abiv1.sol",
    "test/samples/solidity/struct_docs_04.sol",
    "test/samples/solidity/signatures.sol",
    "test/samples/solidity/getters_07.sol",
    "test/samples/solidity/source_map.sol",
    "test/samples/solidity/latest_imports_08.sol",
    "test/samples/solidity/issue_132_fun_kind.sol",
    "test/samples/solidity/selectors.sol",
    "test/samples/solidity/meta/complex_imports/c.sol",
    "test/samples/solidity/meta/pragma.sol",
    "test/samples/solidity/writer_edge_cases.sol",
    "test/samples/solidity/reports/B.sol",
    "test/samples/solidity/reports/A.sol",
    "test/samples/solidity/looks_same_075.sourced.sm.sol",
    "test/samples/solidity/expressions/conditional_050.sol",
    "test/samples/solidity/expressions/conditional_0413.sol",
    "test/samples/solidity/super.sol",
    "test/samples/solidity/constant_expressions.sol",
    "test/samples/solidity/decoding_test.sol",
    "test/samples/solidity/ops.sol",
    "test/samples/solidity/builtins_0426.sol",
    "test/samples/solidity/builtins_0426.sol",
    "test/samples/solidity/builtins_0816.sol",
    "test/samples/solidity/different_abi_encoders/v1_imports_v2/v1.sol",
    "test/samples/solidity/different_abi_encoders/v2_imports_v1/v2.sol",
    "test/samples/solidity/type_inference/sample00.sol",
    "test/samples/solidity/type_inference/sample01.sol",
    "test/samples/solidity/type_inference/sample02.sol",
    "test/samples/solidity/type_inference/sample03.sol",
    "test/samples/solidity/user_defined_operators_0819.sol"
];

function toSoliditySource(expr: Expression, compilerVersion: string) {
    const writer = new ASTWriter(DefaultASTWriterMapping, new PrettyFormatter(4), compilerVersion);

    return writer.write(expr);
}

function externalParamEq(a: TypeNode | null, b: TypeNode | null): boolean {
    if (a === null && b === null) {
        return true;
    }

    if (a === null || b === null) {
        return false;
    }

    if (a instanceof PointerType && b instanceof PointerType) {
        if (
            !(
                a.location === b.location ||
                (a.location === DataLocation.CallData && b.location === DataLocation.Memory)
            )
        ) {
            return false;
        }

        return externalParamEq(a.to, b.to);
    }

    if (a instanceof ArrayType && b instanceof ArrayType) {
        if (a.size !== b.size) {
            return false;
        }

        return externalParamEq(a.elementT, b.elementT);
    }

    if (a instanceof TupleType && b instanceof TupleType) {
        if (a.elements.length !== b.elements.length) {
            return false;
        }

        for (let i = 0; i < a.elements.length; i++) {
            if (!externalParamEq(a.elements[i], b.elements[i])) {
                return false;
            }
        }

        return true;
    }

    return eq(a, b);
}

function externalParamsEq(inferredParams: TypeNode[], parsedParams: TypeNode[]): boolean {
    for (let i = 0; i < inferredParams.length; i++) {
        const inferred = inferredParams[i];
        const parsed = parsedParams[i];

        if (!externalParamEq(inferred, parsed)) {
            return false;
        }
    }

    return true;
}

function exprIsABIDecodeArg(expr: Expression): boolean {
    const call = expr.getClosestParentByType(FunctionCall);

    if (call === undefined) {
        return false;
    }

    return (
        call.vFunctionName === "decode" && call.vFunctionCallType === ExternalReferenceType.Builtin
    );
}

function stripSingleTuples(t: TypeNode): TypeNode {
    let res = t;

    while (res instanceof TupleType && res.elements.length === 1) {
        const elT = res.elements[0];

        assert(elT !== null, "Unexpected tuple with single empty element: {0}", t);

        res = elT;
    }

    return res;
}

/**
 * This function compares an inferred type (`inferredT`) to the type parsed from
 * a typeString (`parsedT`) for a given expression `expr`
 *
 * There are several known cases where we diverge from typeString, that are documented
 * in this function.
 */
function compareTypeNodes(
    inferredT: TypeNode,
    parsedT: TypeNode,
    expr: Expression,
    version: string
): boolean {
    inferredT = stripSingleTuples(inferredT);
    parsedT = stripSingleTuples(parsedT);

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
        (expr instanceof Identifier ||
            expr instanceof MemberAccess ||
            (expr instanceof FunctionCall && ["value", "gas"].includes(expr.vFunctionName))) &&
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
        (inferredT instanceof IntLiteralType || inferredT instanceof TupleType)
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

    /// The typstring parser something mistakenly infers `bytes memory` for external calls even though the signature
    /// is `bytes calldata (see test/samples/solidity/type_inference/sample00.sol the type of c.foo in `c.foo(123, hex"c0ffee");`).
    /// I believe the correct behavior is to infer the declared calldata location. So ignore this case.
    if (
        inferredT instanceof FunctionType &&
        parsedT instanceof FunctionType &&
        isVisiblityExternallyCallable(inferredT.visibility) &&
        externalParamsEq(inferredT.parameters, parsedT.parameters) &&
        eq(inferredT.returns, parsedT.returns)
    ) {
        return true;
    }

    /// In some versions hex strings have kind 'string' in the AST, but 'hex' in the typeString parser
    if (
        inferredT instanceof StringLiteralType &&
        parsedT instanceof StringLiteralType &&
        inferredT.kind !== parsedT.kind
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
    /// the string parser returns the simpler ModuleType.
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
    // @todo Remove this if after re-writing the eval_consts.ts file to something sane.
    if (inferredT instanceof RationalLiteralType && parsedT instanceof RationalLiteralType) {
        return true;
    }

    // For type tuples and type names in abi.decode() args the compiler emits storage pointer
    // types.  E.g. for (uint, string) the typeString would be
    // `tuple(type(uint256),type(string storage pointer))` for some reason.  We
    // just emit "tuple(type(uint256),type(string))"
    if (
        inferredT instanceof TupleType &&
        parsedT instanceof TupleType &&
        inferredT.elements.length === parsedT.elements.length &&
        exprIsABIDecodeArg(expr)
    ) {
        for (let i = 0; i < parsedT.elements.length; i++) {
            if (
                !compareTypeNodes(
                    generalizeType(inferredT.elements[i] as TypeNode)[0],
                    generalizeType(parsedT.elements[i] as TypeNode)[0],
                    expr,
                    version
                )
            ) {
                return false;
            }
        }

        return true;
    }

    if (
        inferredT instanceof TypeNameType &&
        parsedT instanceof TypeNameType &&
        exprIsABIDecodeArg(expr)
    ) {
        return compareTypeNodes(
            generalizeType(inferredT.type)[0],
            generalizeType(parsedT.type)[0],
            expr,
            version
        );
    }

    // We sometimes disagree with the inferred location of params for external
    // functions. On <=0.4.26 we always assume calldata, while the typestring sometimes
    // picks memory for args. On >=0.5.0 even when args are explicitly calldata sometimes
    // the typestring parser is still memory
    if (
        inferredT instanceof FunctionType &&
        parsedT instanceof FunctionType &&
        (inferredT.visibility === FunctionVisibility.External ||
            parsedT.visibility === FunctionVisibility.External) &&
        inferredT.parameters.length === parsedT.parameters.length &&
        inferredT.parameters.length === parsedT.parameters.length
    ) {
        const infParams = generalizeType(new TupleType(inferredT.parameters))[0];
        const infReturns = generalizeType(new TupleType(inferredT.returns))[0];
        const parsedParams = generalizeType(new TupleType(parsedT.parameters))[0];
        const parsedReturns = generalizeType(new TupleType(parsedT.returns))[0];

        return (
            compareTypeNodes(infParams, parsedParams, expr, version) &&
            compareTypeNodes(infReturns, parsedReturns, expr, version)
        );
    }

    // For solidity <0.5.0 the kind field of string literals is "string" for hex strings.
    // This causes some inaccuracies when comparing string literals just based on value.
    // @todo remove this if/when we remove/refactor StringLiteralType
    if (
        inferredT instanceof StringLiteralType &&
        parsedT instanceof StringLiteralType &&
        expr instanceof Literal &&
        expr.hexValue !== "" &&
        lt(version, "0.5.0")
    ) {
        return true;
    }

    // For expressions involving int constants the type string varies with the
    // compiler version and situation between int and int_literal.  We always
    // compute the declared type.
    if (inferredT instanceof IntType && parsedT instanceof IntLiteralType) {
        let hasConstIdChild = false;
        expr.walk((nd) => {
            if (
                nd instanceof Identifier &&
                nd.vReferencedDeclaration instanceof VariableDeclaration &&
                nd.vReferencedDeclaration.constant
            ) {
                hasConstIdChild = true;
            }
        });

        if (hasConstIdChild) {
            return true;
        }
    }

    // For the callee of a type conversion we return the generalized type, instead of the specialized type.
    if (
        inferredT instanceof TypeNameType &&
        parsedT instanceof TypeNameType &&
        inferredT.type.pp() === generalizeType(parsedT.type)[0].pp() &&
        expr.parent instanceof FunctionCall &&
        expr.parent.vExpression === expr &&
        expr.parent.kind == FunctionCallKind.TypeConversion
    ) {
        return true;
    }

    // The typestring includes 'inaccessible dynamic type'. Just assume we are correct
    if (parsedT.pp().includes("inaccessible dynamic type")) {
        return true;
    }

    // After 0.8.0 the signature of push changed to include the implicit reference. Ignore those failrues
    if (
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        inferredT.parameters.length === 1 &&
        parsedT.parameters.length === 2 &&
        eq(inferredT.parameters[0], parsedT.parameters[1]) &&
        expr instanceof MemberAccess &&
        expr.memberName === "push" &&
        gte(version, "0.8.0")
    ) {
        return true;
    }

    if (
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        inferredT.parameters.length === 0 &&
        parsedT.parameters.length === 1 &&
        inferredT.returns.length === 1 &&
        parsedT.returns.length === 1 &&
        eq(inferredT.returns[0], parsedT.returns[0]) &&
        expr instanceof MemberAccess &&
        expr.memberName === "push" &&
        gte(version, "0.8.0")
    ) {
        return true;
    }

    // After 0.8.0 the signature of pop changed to include the implicit reference. Ignore those failrues
    if (
        inferredT instanceof BuiltinFunctionType &&
        parsedT instanceof FunctionType &&
        inferredT.parameters.length === 0 &&
        parsedT.parameters.length === 1 &&
        expr instanceof MemberAccess &&
        expr.memberName === "pop" &&
        gte(version, "0.8.0")
    ) {
        return true;
    }

    return eq(inferredT, parsedT);
}

const ENV_CUSTOM_PATH = "SOLC_TEST_SAMPLES_PATH";

describe("Type inference for expressions", () => {
    const path = process.env[ENV_CUSTOM_PATH];
    const sampleList =
        path !== undefined
            ? fse
                  .readdirSync(path)
                  .filter((name) => name.endsWith(".sol") || name.endsWith(".json"))
                  .map((name) => join(path, name))
            : samples;

    for (const sample of sampleList) {
        it(sample, async () => {
            let result: CompileResult;
            let compilerVersion: string | undefined;
            let data: any;

            try {
                if (sample.endsWith(".sol")) {
                    result = await compileSol(
                        sample,
                        "auto",
                        undefined,
                        undefined,
                        undefined,
                        CompilerKind.Native
                    );
                    expect(result.compilerVersion).toBeDefined();

                    data = result.data;
                    compilerVersion = result.compilerVersion;
                } else if (sample.endsWith(".json")) {
                    data = fse.readJSONSync(sample);
                    const fetchedCompilerVersions = sample.match(/\d+\.\d+\.\d+/);

                    assert(
                        fetchedCompilerVersions !== null && fetchedCompilerVersions.length === 1,
                        "Unable to fetch compiler version"
                    );

                    // Fix compiler version to lowest possible
                    compilerVersion = lt(fetchedCompilerVersions[0], CompilerVersions[0])
                        ? CompilerVersions[0]
                        : fetchedCompilerVersions[0];
                }
            } catch {
                console.error(`Failed compiling ${sample}`);
                return;
            }

            const errors = detectCompileErrors(data);

            expect(errors).toHaveLength(0);

            assert(compilerVersion !== undefined, "Expected compiler version to be defined");

            const astKind = lt(compilerVersion, "0.5.0") ? ASTKind.Legacy : ASTKind.Modern;

            const inference = new InferType(compilerVersion);

            const reader = new ASTReader();
            const sourceUnits = reader.read(data, astKind);

            for (const unit of sourceUnits) {
                for (const expr of unit.getChildrenBySelector<Expression>(
                    (child) => child instanceof Expression
                )) {
                    const inferredType = inference.typeOf(expr);

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
                            inference
                        });
                    } catch (e) {
                        if (e instanceof PeggySyntaxError) {
                            // Failed parsing. Skip
                            continue;
                        }

                        throw e;
                    }

                    assert(
                        compareTypeNodes(inferredType, parsedType, expr, compilerVersion),
                        'Mismatch inferred type "{0}" and parsed type "{1}" (typeString "{2}") for expression {3} -> {4}',
                        inferredType,
                        parsedType,
                        expr.typeString,
                        expr,
                        toSoliditySource(expr, compilerVersion)
                    );
                }
            }

            // Test typeOfCallee
            for (const unit of sourceUnits) {
                for (const expr of unit.getChildrenBySelector<FunctionCall>(
                    (child) => child instanceof FunctionCall
                )) {
                    if (expr.kind !== FunctionCallKind.FunctionCall) {
                        continue;
                    }

                    const calleeT = inference.typeOfCallee(expr);

                    expect(calleeT).toBeDefined();
                    assert(calleeT !== undefined, "Expected callee type to be defined");

                    const hasImplicitArg =
                        calleeT instanceof FunctionType && calleeT.implicitFirstArg;

                    const formalArgTs = hasImplicitArg
                        ? calleeT.parameters.slice(1)
                        : calleeT.parameters;

                    expect(formalArgTs.length === expr.vArguments.length).toBeTruthy();

                    for (let i = 0; i < formalArgTs.length; i++) {
                        const actualT = inference.typeOf(expr.vArguments[i]);

                        expect(castable(actualT, formalArgTs[i], compilerVersion)).toBeTruthy();
                    }
                }
            }
        });
    }
});
