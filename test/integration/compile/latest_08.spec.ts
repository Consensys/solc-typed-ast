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
    ["ContractDefinition", 3],
    ["FunctionDefinition", 5],
    ["ParameterList", 10],
    ["VariableDeclaration", 6],
    ["ElementaryTypeName", 7],
    ["Block", 5],
    ["VariableDeclarationStatement", 4],
    ["Literal", 5],
    ["UncheckedBlock", 1],
    ["ExpressionStatement", 1],
    ["UnaryOperation", 1],
    ["Identifier", 3],
    ["Return", 2],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 6],
    ["UsingForDirective", 1],
    ["UserDefinedTypeName", 2],
    ["ModifierInvocation", 1],
    ["FunctionCall", 3],
    ["MemberAccess", 4],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 2]
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

        expect(sourceUnit.id).toEqual(81);
        expect(sourceUnit.src).toEqual("0:780:0");
        expect(sourceUnit.absolutePath).toEqual(mainSample);
        expect(sourceUnit.children.length).toEqual(6);
        expect(sourceUnit.getChildren().length).toEqual(77);
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
