import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerVersions08,
    compileSol,
    detectCompileErrors,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const mainSample = "./test/samples/solidity/latest_08.sol";
const mainContent = fse.readFileSync(mainSample).toString();
const importSample = "./test/samples/solidity/latest_imports_08.sol";
const importContent = fse.readFileSync(importSample).toString();

const expectedFiles = new Map<string, string>([
    [mainSample, mainContent],
    [importSample, importContent]
]);

const compilerVersion = CompilerVersions08[CompilerVersions08.length - 1];

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 2],
    ["ImportDirective", 1],
    ["EnumDefinition", 2],
    ["EnumValue", 6],
    ["ContractDefinition", 5],
    ["FunctionDefinition", 7],
    ["ParameterList", 20],
    ["VariableDeclaration", 15],
    ["ElementaryTypeName", 14],
    ["Block", 24],
    ["VariableDeclarationStatement", 8],
    ["Literal", 18],
    ["UncheckedBlock", 2],
    ["ExpressionStatement", 7],
    ["UnaryOperation", 2],
    ["Identifier", 15],
    ["Return", 3],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 10],
    ["UsingForDirective", 1],
    ["UserDefinedTypeName", 6],
    ["ModifierInvocation", 1],
    ["FunctionCall", 12],
    ["MemberAccess", 6],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 2],
    ["NewExpression", 2],
    ["TryStatement", 2],
    ["TryCatchClause", 8],
    ["IfStatement", 3],
    ["BinaryOperation", 3],
    ["EventDefinition", 1],
    ["ModifierDefinition", 1],
    ["PlaceholderStatement", 1],
    ["TupleExpression", 2],
    ["EmitStatement", 1],
    ["WhileStatement", 1],
    ["Continue", 1],
    ["DoWhileStatement", 1],
    ["Break", 1],
    ["ForStatement", 1],
    ["InlineAssembly", 1]
]);

describe(`Compile ${mainSample} with ${compilerVersion} compiler`, () => {
    const kind = ASTKind.Modern;

    let data: any = {};
    let sourceUnits: SourceUnit[];

    before("Compile", (done) => {
        const result = compileSol(mainSample, "auto", []);

        expect(result.compilerVersion).toEqual(compilerVersion);
        expect(result.files).toEqual(expectedFiles);

        const errors = detectCompileErrors(result.data);

        expect(errors).toHaveLength(0);

        data = result.data;

        done();
    });

    it(`Parse compiler output (${kind})`, () => {
        const reader = new ASTReader();

        sourceUnits = reader.read(data, kind);

        expect(sourceUnits.length).toEqual(2);

        const sourceUnit = sourceUnits[0];

        expect(sourceUnit.id).toEqual(225);
        expect(sourceUnit.src).toEqual("0:3335:0");
        expect(sourceUnit.absolutePath).toEqual(mainSample);
        expect(sourceUnit.children.length).toEqual(9);
        expect(sourceUnit.getChildren().length).toEqual(221);
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
});
