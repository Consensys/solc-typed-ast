import expect from "expect";
import { gte } from "semver";
import {
    ASTKind,
    ASTReader,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    compileSol,
    DataLocation,
    detectCompileErrors,
    eq,
    Expression,
    FunctionTypeName,
    Identifier,
    ModifierInvocation,
    VariableDeclaration
} from "../../../src";
import {
    generalizeType,
    getNodeType,
    PointerType,
    specializeType,
    variableDeclarationToTypeNode
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
    ]
];

describe("Round-trip tests for typestring parser/printer", () => {
    for (const [sample, compilerVersion, kind] of samples) {
        it(`Sample ${sample}`, () => {
            const result = compileSol(sample, "auto", []);

            expect(result.compilerVersion).toEqual(compilerVersion);
            const errors = detectCompileErrors(result.data);

            expect(errors).toHaveLength(0);

            const data = result.data;

            const reader = new ASTReader();
            const sourceUnits = reader.read(data, kind);

            for (const unit of sourceUnits) {
                for (const node of unit.getChildrenBySelector(
                    (child) => child instanceof Expression || child instanceof VariableDeclaration
                )) {
                    const typedASTNode = node as Expression | VariableDeclaration;

                    // typeStrings for Identifiers in ImportDirectives may be undefined.
                    if (typedASTNode.typeString === undefined) {
                        continue;
                    }

                    // Skip modifier invocations
                    if (typedASTNode.parent instanceof ModifierInvocation) {
                        continue;
                    }

                    const typeNode = getNodeType(typedASTNode, compilerVersion);

                    // Edge case: We don't fully model type strings for external function type names.
                    // External function type strings contain the funtion name as well, which we ignore
                    // and treat them as normal type names.
                    if (
                        typeNode instanceof FunctionTypeName &&
                        typedASTNode.typeString.includes("SampleInterface.infFunc")
                    ) {
                        continue;
                    }

                    const compTypeString = typeNode.pp();

                    // typeStrings shorten some int_const by omitting digits.
                    // Ignore those as we can't correctly reproduce them.
                    if (
                        typedASTNode.typeString.trim() !== compTypeString &&
                        typedASTNode.typeString.includes("digits omitted")
                    ) {
                        continue;
                    }

                    expect(typedASTNode.typeString.trim()).toEqual(compTypeString.trim());

                    // Check that the conversion from TypeNode ast nodes to
                    if (
                        gte(compilerVersion, "0.5.0") &&
                        typedASTNode instanceof Identifier &&
                        typedASTNode.vReferencedDeclaration instanceof VariableDeclaration &&
                        typedASTNode.vReferencedDeclaration.vType !== undefined
                    ) {
                        const compType2 = variableDeclarationToTypeNode(
                            typedASTNode.vReferencedDeclaration
                        );

                        if (
                            compType2 instanceof PointerType &&
                            compType2.location === DataLocation.Default
                        ) {
                            continue;
                        }

                        expect(eq(compType2, typeNode)).toBeTruthy();
                        // Check that specialize and generalize are inverses

                        const [generalizedType, loc] = generalizeType(typeNode);

                        console.error(
                            `generalizing ${typeNode.pp()} to ${generalizedType.pp()} loc: ${loc}`
                        );
                        const reSpecializedType = specializeType(
                            generalizedType,
                            loc === undefined ? DataLocation.Default : loc
                        );
                        console.error(
                            `Comparing ${typeNode.pp()} and re-specialized ${reSpecializedType.pp()} (generalized: ${generalizedType.pp()} loc: ${loc})`
                        );
                        expect(eq(typeNode, reSpecializedType)).toBeTruthy();
                    }
                }
            }
        });
    }
});
