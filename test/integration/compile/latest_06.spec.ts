import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerKind,
    CompilerVersions06,
    compileSol,
    detectCompileErrors,
    FileMap,
    PossibleCompilerKinds,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/latest_06.sol";
const content = fse.readFileSync(sample);
const expectedFiles: FileMap = new Map([[sample, content]]);
const compilerVersion = CompilerVersions06[CompilerVersions06.length - 1];

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 3],
    ["EnumDefinition", 1],
    ["EnumValue", 3],
    ["StructDefinition", 1],
    ["VariableDeclaration", 68],
    ["ElementaryTypeName", 83],
    ["ArrayTypeName", 17],
    ["Mapping", 3],
    ["UserDefinedTypeName", 8],
    ["ContractDefinition", 9],
    ["StructuredDocumentation", 11],
    ["FunctionDefinition", 22],
    ["ParameterList", 56],
    ["Block", 30],
    ["Return", 6],
    ["TupleExpression", 6],
    ["BinaryOperation", 14],
    ["Identifier", 86],
    ["ModifierDefinition", 4],
    ["ExpressionStatement", 27],
    ["Assignment", 8],
    ["InheritanceSpecifier", 2],
    ["Literal", 38],
    ["EventDefinition", 1],
    ["OverrideSpecifier", 3],
    ["PlaceholderStatement", 3],
    ["FunctionCall", 30],
    ["EmitStatement", 1],
    ["ElementaryTypeNameExpression", 17],
    ["MemberAccess", 29],
    ["UnaryOperation", 6],
    ["VariableDeclarationStatement", 20],
    ["IndexRangeAccess", 4],
    ["ModifierInvocation", 2],
    ["TryStatement", 2],
    ["NewExpression", 3],
    ["TryCatchClause", 5],
    ["FunctionCallOptions", 1],
    ["FunctionTypeName", 2],
    ["IndexAccess", 8],
    ["ForStatement", 3]
]);

for (const compilerKind of PossibleCompilerKinds) {
    describe(`Compile ${sample} with ${compilerKind} ${compilerVersion} compiler`, () => {
        let data: any = {};
        let sourceUnits: SourceUnit[];

        beforeAll(async () => {
            const result = await compileSol(
                sample,
                "auto",
                undefined,
                undefined,
                undefined,
                compilerKind as CompilerKind
            );

            expect(result.compilerVersion).toEqual(compilerVersion);
            expect(result.files).toEqual(expectedFiles);

            const errors = detectCompileErrors(result.data);

            expect(errors).toHaveLength(0);

            data = result.data;
        });

        for (const astKind of [ASTKind.Modern, ASTKind.Legacy]) {
            it(`Parse compiler output (${astKind})`, () => {
                const reader = new ASTReader();

                sourceUnits = reader.read(data, astKind);

                expect(sourceUnits.length).toEqual(1);

                const sourceUnit = sourceUnits[0];

                expect(sourceUnit.id).toEqual(664);
                expect(sourceUnit.src).toEqual("0:5704:0");
                expect(sourceUnit.absolutePath).toEqual(sample);
                expect(sourceUnit.children.length).toEqual(14);
                expect(sourceUnit.getChildren().length).toEqual(646);
            });

            it(`Validate parsed output (${astKind})`, () => {
                const sourceUnit = sourceUnits[0];
                const sourceUnitImprint = createImprint(sourceUnit);

                expect(sourceUnitImprint.ASTNode).toBeUndefined();

                for (const [type, count] of encounters.entries()) {
                    expect(sourceUnitImprint[type]).toBeDefined();
                    expect(sourceUnitImprint[type].length).toEqual(count);

                    const nodes = sourceUnit.getChildrenBySelector(
                        (node) => node.type === type,
                        type === "SourceUnit"
                    );

                    expect(nodes.length).toEqual(count);
                }
            });
        }
    });
}
