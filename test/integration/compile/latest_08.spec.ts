import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerKind,
    CompilerVersions08,
    compileSol,
    detectCompileErrors,
    PossibleCompilerKinds,
    SourceUnit
} from "../../../src";
import { isYulASTNode } from "../../../src/ast/implementation/yul";
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
    ["ContractDefinition", 17],
    ["FunctionDefinition", 33],
    ["ParameterList", 85],
    ["VariableDeclaration", 71],
    ["ElementaryTypeName", 57],
    ["Block", 49],
    ["VariableDeclarationStatement", 16],
    ["Literal", 38],
    ["UncheckedBlock", 4],
    ["ExpressionStatement", 21],
    ["UnaryOperation", 5],
    ["Identifier", 90],
    ["Return", 14],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 33],
    ["UsingForDirective", 3],
    ["UserDefinedTypeName", 24],
    ["ModifierInvocation", 2],
    ["FunctionCall", 42],
    ["MemberAccess", 38],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 4],
    ["NewExpression", 2],
    ["TryStatement", 2],
    ["TryCatchClause", 8],
    ["IfStatement", 3],
    ["BinaryOperation", 22],
    ["EventDefinition", 2],
    ["ModifierDefinition", 1],
    ["PlaceholderStatement", 1],
    ["TupleExpression", 9],
    ["EmitStatement", 1],
    ["WhileStatement", 1],
    ["Continue", 1],
    ["DoWhileStatement", 1],
    ["Break", 1],
    ["ForStatement", 1],
    ["InlineAssembly", 6],
    ["ErrorDefinition", 4],
    ["StructuredDocumentation", 3],
    ["RevertStatement", 3],
    ["UserDefinedValueTypeDefinition", 5],
    ["FunctionTypeName", 4],
    ["Assignment", 3]
]);

for (const compilerKind of PossibleCompilerKinds) {
    describe(`Compile ${mainSample} with ${compilerKind} ${compilerVersion} compiler`, () => {
        const astKind = ASTKind.Modern;

        let data: any = {};
        let sourceUnits: SourceUnit[];

        before("Compile", async () => {
            const result = await compileSol(
                mainSample,
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

        it(`Parse compiler output (${astKind})`, () => {
            const reader = new ASTReader();

            sourceUnits = reader.read(data, astKind);

            expect(sourceUnits.length).toEqual(2);

            const sourceUnit = sourceUnits[0];

            // Uncomment following lines to get the current state of unit:
            // console.log(sourceUnit.print());
            // console.log(sourceUnit.getChildren().length);

            expect(sourceUnit.id).toEqual(750);
            expect(sourceUnit.src).toEqual("0:8713:0");
            expect(sourceUnit.absolutePath).toEqual(mainSample);
            expect(sourceUnit.children.length).toEqual(30);

            const children = sourceUnit.getChildrenBySelector((node) => !isYulASTNode(node), false);
            expect(children.length).toEqual(743);
        });

        it(`Validate parsed output (${astKind})`, () => {
            const sourceUnit = sourceUnits[0];
            const sourceUnitImprint = createImprint(sourceUnit);

            expect(sourceUnitImprint.ASTNode).toBeUndefined();

            // Uncomment following lines to get the current unit snapshot data:
            // for (const [type, nodes] of Object.entries(sourceUnitImprint)) {
            //     console.log(`["${type}", ${nodes.length}],`);
            // }

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
