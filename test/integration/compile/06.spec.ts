import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerVersions06,
    compileSol,
    detectCompileErrors,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/compile_06.sol";
const content = fse.readFileSync(sample).toString();
const expectedFiles = new Map<string, string>([[sample, content]]);

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 1],
    ["EnumDefinition", 1],
    ["EnumValue", 3],
    ["StructDefinition", 1],
    ["VariableDeclaration", 29],
    ["ElementaryTypeName", 41],
    ["ArrayTypeName", 1],
    ["Mapping", 1],
    ["ContractDefinition", 4],
    ["EventDefinition", 1],
    ["ModifierDefinition", 1],
    ["ModifierInvocation", 1],
    ["EmitStatement", 1],
    ["FunctionDefinition", 8],
    ["ParameterList", 21],
    ["Block", 13],
    ["Return", 2],
    ["BinaryOperation", 1],
    ["Identifier", 17],
    ["InheritanceSpecifier", 1],
    ["UserDefinedTypeName", 5],
    ["OverrideSpecifier", 1],
    ["FunctionCall", 10],
    ["ElementaryTypeNameExpression", 12],
    ["VariableDeclarationStatement", 8],
    ["MemberAccess", 10],
    ["IndexRangeAccess", 4],
    ["Literal", 8],
    ["TupleExpression", 5],
    ["TryStatement", 2],
    ["NewExpression", 2],
    ["TryCatchClause", 5],
    ["PlaceholderStatement", 1]
]);

describe(`Compile ${sample} with any available 0.6.x compiler`, () => {
    for (const version of CompilerVersions06) {
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

            for (const kind of [ASTKind.Modern, ASTKind.Legacy]) {
                it(`Process compiler output (${kind})`, () => {
                    const reader = new ASTReader();

                    sourceUnits = reader.read(data, kind);

                    expect(sourceUnits.length).toEqual(1);

                    const sourceUnit = sourceUnits[0];

                    expect(sourceUnit.id).toEqual(223);
                    expect(sourceUnit.src).toEqual("0:1586:0");
                    expect(sourceUnit.absolutePath).toEqual(sample);
                    expect(sourceUnit.children.length).toEqual(7);
                    expect(sourceUnit.getChildren().length).toEqual(222);
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
