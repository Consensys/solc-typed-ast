import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    CompilerKind,
    CompilerVersions08,
    compileSol,
    detectCompileErrors,
    FileMap,
    PossibleCompilerKinds,
    SourceUnit
} from "../../../src";
import { createImprint } from "./common";

const mainSample = "./test/samples/solidity/latest_08.sol";
const mainContent = fse.readFileSync(mainSample);
const importSample = "./test/samples/solidity/latest_imports_08.sol";
const importContent = fse.readFileSync(importSample);

const expectedFiles: FileMap = new Map([
    [mainSample, mainContent],
    [importSample, importContent]
]);

const compilerVersion = CompilerVersions08[CompilerVersions08.length - 1];

const encounters = new Map<string, number>([
    ["SourceUnit", 1],
    ["PragmaDirective", 2],
    ["ImportDirective", 1],
    ["StructDefinition", 1],
    ["StructuredDocumentation", 6],
    ["VariableDeclaration", 85],
    ["ElementaryTypeName", 69],
    ["EnumDefinition", 2],
    ["EnumValue", 6],
    ["ContractDefinition", 22],
    ["FunctionDefinition", 36],
    ["ParameterList", 97],
    ["Block", 52],
    ["VariableDeclarationStatement", 16],
    ["Literal", 43],
    ["UncheckedBlock", 4],
    ["ExpressionStatement", 25],
    ["UnaryOperation", 6],
    ["Identifier", 112],
    ["Return", 15],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 36],
    ["UsingForDirective", 3],
    ["UserDefinedTypeName", 27],
    ["ModifierInvocation", 2],
    ["FunctionCall", 49],
    ["MemberAccess", 44],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 4],
    ["NewExpression", 2],
    ["TryStatement", 2],
    ["TryCatchClause", 8],
    ["IfStatement", 3],
    ["BinaryOperation", 24],
    ["EventDefinition", 7],
    ["ModifierDefinition", 1],
    ["PlaceholderStatement", 1],
    ["TupleExpression", 9],
    ["EmitStatement", 6],
    ["WhileStatement", 1],
    ["Continue", 1],
    ["DoWhileStatement", 1],
    ["Break", 1],
    ["ForStatement", 1],
    ["InlineAssembly", 6],
    ["ErrorDefinition", 5],
    ["RevertStatement", 3],
    ["UserDefinedValueTypeDefinition", 5],
    ["FunctionTypeName", 4],
    ["Assignment", 5],
    ["Mapping", 1],
    ["IndexAccess", 4],
    ["SourceUnit", 1],
    ["PragmaDirective", 2],
    ["ImportDirective", 1],
    ["StructDefinition", 1],
    ["StructuredDocumentation", 6],
    ["VariableDeclaration", 85],
    ["ElementaryTypeName", 69],
    ["EnumDefinition", 2],
    ["EnumValue", 6],
    ["ContractDefinition", 22],
    ["FunctionDefinition", 36],
    ["ParameterList", 97],
    ["Block", 52],
    ["VariableDeclarationStatement", 16],
    ["Literal", 43],
    ["UncheckedBlock", 4],
    ["ExpressionStatement", 25],
    ["UnaryOperation", 6],
    ["Identifier", 112],
    ["Return", 15],
    ["InheritanceSpecifier", 1],
    ["IdentifierPath", 36],
    ["UsingForDirective", 3],
    ["UserDefinedTypeName", 27],
    ["ModifierInvocation", 2],
    ["FunctionCall", 49],
    ["MemberAccess", 44],
    ["OverrideSpecifier", 1],
    ["ElementaryTypeNameExpression", 4],
    ["NewExpression", 2],
    ["TryStatement", 2],
    ["TryCatchClause", 8],
    ["IfStatement", 3],
    ["BinaryOperation", 24],
    ["EventDefinition", 7],
    ["ModifierDefinition", 1],
    ["PlaceholderStatement", 1],
    ["TupleExpression", 9],
    ["EmitStatement", 6],
    ["WhileStatement", 1],
    ["Continue", 1],
    ["DoWhileStatement", 1],
    ["Break", 1],
    ["ForStatement", 1],
    ["InlineAssembly", 6],
    ["ErrorDefinition", 5],
    ["RevertStatement", 3],
    ["UserDefinedValueTypeDefinition", 5],
    ["FunctionTypeName", 4],
    ["Assignment", 5],
    ["Mapping", 1],
    ["IndexAccess", 4]
]);

for (const compilerKind of PossibleCompilerKinds) {
    describe(`Compile ${mainSample} with ${compilerKind} ${compilerVersion} compiler`, () => {
        const astKind = ASTKind.Modern;

        let data: any = {};
        let sourceUnits: SourceUnit[];

        beforeAll(async () => {
            const result = await compileSol(
                mainSample,
                "auto",
                undefined,
                undefined,
                { viaIR: true },
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

            expect(sourceUnit.id).toEqual(878);
            expect(sourceUnit.src).toEqual("0:10179:0");
            expect(sourceUnit.absolutePath).toEqual(mainSample);
            expect(sourceUnit.children.length).toEqual(39);
            expect(sourceUnit.getChildren().length).toEqual(868);
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
