import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerVersions07,
    compileSol,
    detectCompileErrors,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const sample = "./test/samples/solidity/latest_07.sol";
const content = fse.readFileSync(sample).toString();
const expectedFiles = new Map<string, string>([[sample, content]]);
const compilerVersion = CompilerVersions07[CompilerVersions07.length - 1];

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 1],
    ["ContractDefinition", 6],
    ["FunctionDefinition", 11],
    ["ParameterList", 25],
    ["VariableDeclaration", 28],
    ["ElementaryTypeName", 27],
    ["Block", 14],
    ["Return", 3],
    ["TupleExpression", 3],
    ["BinaryOperation", 12],
    ["Identifier", 46],
    ["Conditional", 1],
    ["ArrayTypeName", 5],
    ["ForStatement", 3],
    ["VariableDeclarationStatement", 10],
    ["Literal", 18],
    ["MemberAccess", 6],
    ["ExpressionStatement", 11],
    ["UnaryOperation", 3],
    ["Assignment", 4],
    ["IndexAccess", 4],
    ["UsingForDirective", 2],
    ["UserDefinedTypeName", 7],
    ["FunctionCall", 13],
    ["InheritanceSpecifier", 1],
    ["EventDefinition", 1],
    ["FunctionTypeName", 1],
    ["EmitStatement", 1],
    ["NewExpression", 2]
]);

describe(`Compile ${sample} with ${compilerVersion} compiler`, () => {
    let data: any = {};
    let sourceUnits: SourceUnit[];

    before("Compile", (done) => {
        const result = compileSol(sample, "auto", []);

        expect(result.compilerVersion).toEqual(compilerVersion);
        expect(result.files).toEqual(expectedFiles);

        const errors = detectCompileErrors(result.data);

        expect(errors).toHaveLength(0);

        data = result.data;

        done();
    });

    for (const kind of [ASTKind.Modern, ASTKind.Legacy]) {
        it(`Parse compiler output (${kind})`, () => {
            const reader = new ASTReader();

            sourceUnits = reader.read(data, kind);

            expect(sourceUnits.length).toEqual(1);

            const sourceUnit = sourceUnits[0];

            expect(sourceUnit.id).toEqual(273);
            expect(sourceUnit.src).toEqual("0:1765:0");
            expect(sourceUnit.absolutePath).toEqual(sample);
            expect(sourceUnit.children.length).toEqual(10);
            expect(sourceUnit.getChildren().length).toEqual(269);
        });

        it(`Validate parsed output (${kind})`, () => {
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
