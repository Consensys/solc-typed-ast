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
    ["ContractDefinition", 14],
    ["FunctionDefinition", 26],
    ["ParameterList", 69],
    ["VariableDeclaration", 54],
    ["ElementaryTypeName", 47],
    ["Block", 42],
    ["VariableDeclarationStatement", 16],
    ["Literal", 31],
    ["UncheckedBlock", 2],
    ["ExpressionStatement", 14],
    ["UnaryOperation", 4],
    ["Identifier", 64],
    ["Return", 11],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 19],
    ["UsingForDirective", 1],
    ["UserDefinedTypeName", 14],
    ["ModifierInvocation", 2],
    ["FunctionCall", 30],
    ["MemberAccess", 28],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 4],
    ["NewExpression", 2],
    ["TryStatement", 2],
    ["TryCatchClause", 8],
    ["IfStatement", 3],
    ["BinaryOperation", 14],
    ["EventDefinition", 1],
    ["ModifierDefinition", 1],
    ["PlaceholderStatement", 1],
    ["TupleExpression", 6],
    ["EmitStatement", 1],
    ["WhileStatement", 1],
    ["Continue", 1],
    ["DoWhileStatement", 1],
    ["Break", 1],
    ["ForStatement", 1],
    ["InlineAssembly", 4],
    ["ErrorDefinition", 3],
    ["StructuredDocumentation", 3],
    ["RevertStatement", 3],
    ["UserDefinedValueTypeDefinition", 4],
    ["FunctionTypeName", 4]
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
                [],
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

            expect(sourceUnit.id).toEqual(577);
            expect(sourceUnit.src).toEqual("0:7057:0");
            expect(sourceUnit.absolutePath).toEqual(mainSample);
            expect(sourceUnit.children.length).toEqual(21);
            expect(sourceUnit.getChildren().length).toEqual(570);
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
