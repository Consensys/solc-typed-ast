import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerKind,
    CompilerVersions07,
    compileSol,
    detectCompileErrors,
    FileMap,
    PossibleCompilerKinds,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/latest_07.sol";
const content = fse.readFileSync(sample);
const expectedFiles: FileMap = new Map([[sample, content]]);
const compilerVersion = CompilerVersions07[CompilerVersions07.length - 1];

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 2],
    ["ContractDefinition", 8],
    ["FunctionDefinition", 14],
    ["ParameterList", 31],
    ["VariableDeclaration", 39],
    ["ElementaryTypeName", 37],
    ["Block", 20],
    ["Return", 4],
    ["TupleExpression", 3],
    ["BinaryOperation", 13],
    ["Identifier", 59],
    ["Conditional", 1],
    ["ArrayTypeName", 6],
    ["ForStatement", 4],
    ["VariableDeclarationStatement", 12],
    ["Literal", 20],
    ["MemberAccess", 9],
    ["ExpressionStatement", 15],
    ["UnaryOperation", 4],
    ["Assignment", 5],
    ["IndexAccess", 5],
    ["UsingForDirective", 2],
    ["UserDefinedTypeName", 9],
    ["FunctionCall", 17],
    ["InheritanceSpecifier", 1],
    ["EventDefinition", 1],
    ["FunctionTypeName", 1],
    ["EmitStatement", 1],
    ["NewExpression", 2],
    ["StructDefinition", 1],
    ["IfStatement", 1],
    ["ElementaryTypeNameExpression", 1]
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

                expect(sourceUnit.id).toEqual(353);
                expect(sourceUnit.src).toEqual("0:2428:0");
                expect(sourceUnit.absolutePath).toEqual(sample);
                expect(sourceUnit.children.length).toEqual(14);
                expect(sourceUnit.getChildren().length).toEqual(348);
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
