import expect from "expect";
import { gte } from "semver";
import {
    ASTKind,
    ASTReader,
    CompilerKind,
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
    generalizeType,
    Identifier,
    InferType,
    MappingType,
    ModifierInvocation,
    PointerType,
    PossibleCompilerKinds,
    specializeType,
    VariableDeclaration
} from "../../../src";
import { getNodeType } from "../../utils/typeStrings/typeString_parser";

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

function normalizeTypeString(typeStr: string): string {
    // Note that we weaken the typestring comparison to ignore pointer types
    let res = typeStr
        .replace(/ ref/g, "")
        .replace(/ pointer/g, "")
        .replace(/ slice/g, "")
        .trim();

    // We strip string literal values
    if (res.startsWith("literal_string hex")) {
        res = "literal_hex_string";
    } else if (res.startsWith('literal_string "')) {
        res = "literal_string";
    }

    return res;
}

describe("Round-trip tests for typestring parser/printer", () => {
    for (const [sample, compilerVersion, astKind] of samples) {
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

                expect(result.compilerVersion).toEqual(compilerVersion);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                const data = result.data;

                const inference = new InferType(compilerVersion);

                const reader = new ASTReader();
                const sourceUnits = reader.read(data, astKind);

                for (const unit of sourceUnits) {
                    for (const node of unit.getChildrenBySelector(
                        (child) =>
                            child instanceof Expression || child instanceof VariableDeclaration
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

                        const typeNode = getNodeType(typedASTNode, inference);

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

                        let skipTypeStringEqCheck = false;

                        // We disagree with the normal TypeStrings for mappings - we always wrap them in a pointer.
                        if (typeNode instanceof PointerType && typeNode.to instanceof MappingType) {
                            skipTypeStringEqCheck = true;
                        }

                        // typeStrings shorten some int_const by omitting digits.
                        // Ignore those as we can't correctly reproduce them.
                        if (
                            typedASTNode.typeString.trim() !== compTypeString &&
                            typedASTNode.typeString.includes("digits omitted")
                        ) {
                            skipTypeStringEqCheck = true;
                        }

                        if (!skipTypeStringEqCheck) {
                            expect(normalizeTypeString(typedASTNode.typeString)).toEqual(
                                normalizeTypeString(compTypeString)
                            );
                        }

                        // Check that the conversion from TypeNode ast nodes to
                        if (
                            gte(compilerVersion, "0.5.0") &&
                            typedASTNode instanceof Identifier &&
                            typedASTNode.vReferencedDeclaration instanceof VariableDeclaration &&
                            typedASTNode.vReferencedDeclaration.vType !== undefined
                        ) {
                            const compType2 = inference.variableDeclarationToTypeNode(
                                typedASTNode.vReferencedDeclaration
                            );

                            if (
                                compType2 instanceof PointerType &&
                                compType2.location === DataLocation.Default
                            ) {
                                continue;
                            }

                            expect(
                                eq(
                                    normalizeTypeString(compType2.pp()),
                                    normalizeTypeString(typeNode.pp())
                                )
                            ).toBeTruthy();

                            // Check that specialize and generalize are inverses
                            const [generalizedType, loc] = generalizeType(compType2);

                            const reSpecializedType = specializeType(
                                generalizedType,
                                loc === undefined ? DataLocation.Default : loc
                            );

                            expect(eq(compType2, reSpecializedType)).toBeTruthy();
                        }
                    }
                }
            });
        }
    }
});
