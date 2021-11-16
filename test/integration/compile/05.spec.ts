import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerVersions05,
    compileSol,
    detectCompileErrors,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/compile_05.sol";
const content = fse.readFileSync(sample).toString();
const expectedFiles = new Map<string, string>([[sample, content]]);

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 1],
    ["ContractDefinition", 1],
    ["EnumDefinition", 1],
    ["EnumValue", 3],
    ["StructDefinition", 2],
    ["VariableDeclaration", 21],
    ["ElementaryTypeName", 13],
    ["UserDefinedTypeName", 8],
    ["FunctionDefinition", 4],
    ["ParameterList", 8],
    ["Block", 10],
    ["ExpressionStatement", 15],
    ["Assignment", 9],
    ["Identifier", 29],
    ["Literal", 33],
    ["FunctionCall", 4],
    ["MemberAccess", 1],
    ["ElementaryTypeNameExpression", 1],
    ["VariableDeclarationStatement", 2],
    ["IfStatement", 9],
    ["BinaryOperation", 11],
    ["UnaryOperation", 6],
    ["Return", 2],
    ["Conditional", 1],
    ["WhileStatement", 2],
    ["ForStatement", 2],
    ["Continue", 1],
    ["Break", 3],
    ["ArrayTypeName", 2],
    ["TupleExpression", 1]
]);

describe(`Compile ${sample} with any available 0.5.x compiler`, () => {
    for (const version of CompilerVersions05) {
        describe(`Solc ${version}`, () => {
            let data: any = {};
            let sourceUnits: SourceUnit[];

            before("Compile", async () => {
                const result = await compileSol(sample, version, []);

                expect(result.compilerVersion).toEqual(version);
                expect(result.files).toEqual(expectedFiles);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                data = result.data;
            });

            for (const kind of [ASTKind.Modern, ASTKind.Legacy]) {
                it(`Process compiler output (${kind})`, () => {
                    const reader = new ASTReader();

                    sourceUnits = reader.read(data, kind);

                    expect(sourceUnits.length).toEqual(1);

                    const sourceUnit = sourceUnits[0];

                    expect(sourceUnit.id).toEqual(207);
                    expect(sourceUnit.src).toEqual("0:1581:0");
                    expect(sourceUnit.absolutePath).toEqual(sample);
                    expect(sourceUnit.children.length).toEqual(2);
                    expect(sourceUnit.getChildren().length).toEqual(206);
                });

                it(`Validate processed output (${kind})`, () => {
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
});
