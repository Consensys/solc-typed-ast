import expect from "expect";
import {
    ASTKind,
    ASTNodeFactory,
    ASTReader,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    compileSol,
    detectCompileErrors,
    Expression,
    FunctionTypeName,
    ModifierInvocation,
    VariableDeclaration
} from "../../../../src";
import { getNodeType, makeTypeString } from "../../../../src/ast/typestrings";

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

            const factory = new ASTNodeFactory(reader.context);

            for (const unit of sourceUnits) {
                for (const node of unit.getChildrenBySelector(
                    (child) => child instanceof Expression || child instanceof VariableDeclaration
                )) {
                    const typedNode = node as Expression | VariableDeclaration;

                    // typeStrings for Identifiers in ImportDirectives may be undefined.
                    if (typedNode.typeString === undefined) {
                        continue;
                    }

                    // Skip modifier invocations
                    if (typedNode.parent instanceof ModifierInvocation) {
                        continue;
                    }

                    const typeName = getNodeType(typedNode, factory, compilerVersion);

                    // Edge case: We don't fully model type strings for external function type names.
                    // External function type strings contain the funtion name as well, which we ignore
                    // and treat them as normal type names.
                    if (
                        typeName instanceof FunctionTypeName &&
                        typedNode.typeString.includes("SampleInterface.infFunc")
                    ) {
                        continue;
                    }

                    const compTypeString = makeTypeString(typeName).trim();

                    // typeStrings shorten some int_const by omitting digits.
                    // Ignore those as we can't correctly reproduce them.
                    if (
                        typedNode.typeString.trim() !== compTypeString &&
                        typedNode.typeString.includes("digits omitted")
                    ) {
                        continue;
                    }

                    expect(typedNode.typeString.trim()).toEqual(compTypeString.trim());
                }
            }
        });
    }
});
