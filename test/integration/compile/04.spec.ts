import expect from "expect";
import fse from "fs-extra";
import {
    ASTReader,
    CompilerVersions04,
    compileSol,
    detectCompileErrors,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/compile_04.sol";
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
    ["Literal", 35],
    ["FunctionCall", 3],
    ["MemberAccess", 1],
    ["ElementaryTypeNameExpression", 1],
    ["VariableDeclarationStatement", 2],
    ["IfStatement", 10],
    ["BinaryOperation", 12],
    ["UnaryOperation", 7],
    ["Return", 2],
    ["Conditional", 1],
    ["WhileStatement", 2],
    ["ForStatement", 2],
    ["Continue", 1],
    ["Break", 3],
    ["Throw", 1],
    ["ArrayTypeName", 2],
    ["TupleExpression", 1]
]);

describe(`Compile ${sample} with any available 0.4.x compiler`, () => {
    for (const version of CompilerVersions04) {
        describe(`Solc ${version}`, () => {
            let data: any = {};
            let sourceUnits: SourceUnit[];

            before("Compile", () => {
                const result = compileSol(sample, version, []);

                expect(result.compilerVersion).toEqual(version);
                expect(result.files).toEqual(expectedFiles);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                data = result.data;
            });

            it("Process compiler output", () => {
                const reader = new ASTReader();

                sourceUnits = reader.read(data);

                expect(sourceUnits.length).toEqual(1);

                const sourceUnit = sourceUnits[0];

                expect(sourceUnit.id).toEqual(212);
                expect(sourceUnit.src).toEqual("0:1580:0");
                expect(sourceUnit.absolutePath).toEqual(sample);
                expect(sourceUnit.children.length).toEqual(2);
                expect(sourceUnit.getChildren().length).toEqual(211);
            });

            it("Validate processed output", () => {
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
        });
    }
});
