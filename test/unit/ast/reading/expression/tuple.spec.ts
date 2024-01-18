import expect from "expect";
import {
    ASTReader,
    compileJson,
    FunctionCall,
    FunctionDefinition,
    Identifier,
    Literal,
    SourceUnit,
    TupleExpression
} from "../../../../../src";

describe("TupleExpression", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/expressions/tuple_0424.json"],
        ["0.5.0", "test/samples/solidity/expressions/tuple_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let mainUnit: SourceUnit;
            let funcs: readonly FunctionDefinition[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);

                [mainUnit] = reader.read(data);

                funcs = mainUnit.vContracts[0].vFunctions;
            });

            it("Detect correct number of nodes", () => {
                expect(mainUnit.getChildrenByType(TupleExpression).length).toEqual(6);
            });

            it("Tuples in tupleSimple() are valid", () => {
                const nodes = funcs[0].getChildrenByType(TupleExpression);

                expect(nodes.length).toEqual(2);

                expect(nodes[0].id).toEqual(9);
                expect(nodes[0] instanceof TupleExpression).toEqual(true);
                expect(nodes[0].isInlineArray).toEqual(false);
                expect(nodes[0].children.length).toEqual(2);
                expect(nodes[0].vComponents.length).toEqual(2);
                expect(nodes[0].vComponents[0] instanceof Literal).toEqual(true);
                expect(nodes[0].vComponents[1] instanceof Literal).toEqual(true);
                expect(nodes[0].components).toEqual([7, 8]);

                expect(nodes[1].id).toEqual(14);
                expect(nodes[1] instanceof TupleExpression).toEqual(true);
                expect(nodes[1].isInlineArray).toEqual(false);
                expect(nodes[1].children.length).toEqual(1);
                expect(nodes[1].vComponents.length).toEqual(1);
                expect(nodes[1].vComponents[0] instanceof Literal).toEqual(true);
                expect(nodes[1].components).toEqual([13]);
            });

            it("Tuples in tupleNested() are valid", () => {
                const nodes = funcs[1].getChildrenByType(TupleExpression);

                expect(nodes.length).toEqual(3);

                expect(nodes[0].id).toEqual(35);
                expect(nodes[0] instanceof TupleExpression).toEqual(true);
                expect(nodes[0].isInlineArray).toEqual(false);
                expect(nodes[0].children.length).toEqual(3);
                expect(nodes[0].vComponents.length).toEqual(3);
                expect(nodes[0].vComponents[0] instanceof Identifier).toEqual(true);
                expect(nodes[0].vComponents[1] instanceof Identifier).toEqual(true);
                expect(nodes[0].vComponents[2] instanceof Identifier).toEqual(true);
                expect(nodes[0].components).toEqual([32, 33, null, 34]);

                expect(
                    nodes[0].vOriginalComponents.map((exp) => (exp === null ? null : exp.id))
                ).toEqual(nodes[0].components);

                expect(nodes[1].id).toEqual(44);
                expect(nodes[1] instanceof TupleExpression).toEqual(true);
                expect(nodes[1].isInlineArray).toEqual(false);
                expect(nodes[1].children.length).toEqual(4);
                expect(nodes[1].vComponents.length).toEqual(4);
                expect(nodes[1].vComponents[0] instanceof Literal).toEqual(true);
                expect(nodes[1].vComponents[1] instanceof Literal).toEqual(true);
                expect(nodes[1].vComponents[2] instanceof TupleExpression).toEqual(true);
                expect(nodes[1].vComponents[3] instanceof FunctionCall).toEqual(true);
                expect(nodes[1].components).toEqual([36, 37, 40, 43]);

                expect(nodes[2].id).toEqual(40);
                expect(nodes[2] instanceof TupleExpression).toEqual(true);
                expect(nodes[2].isInlineArray).toEqual(false);
                expect(nodes[2].children.length).toEqual(2);
                expect(nodes[2].vComponents.length).toEqual(2);
                expect(nodes[2].vComponents[0] instanceof Literal).toEqual(true);
                expect(nodes[2].vComponents[1] instanceof Literal).toEqual(true);
                expect(nodes[2].components).toEqual([38, 39]);
            });

            it("Tuples in tupleArray() are valid", () => {
                const nodes = funcs[2].getChildrenByType(TupleExpression);

                expect(nodes.length).toEqual(1);

                expect(nodes[0].id).toEqual(59);
                expect(nodes[0] instanceof TupleExpression).toEqual(true);
                expect(nodes[0].isInlineArray).toEqual(true);
                expect(nodes[0].children.length).toEqual(3);
                expect(nodes[0].vComponents.length).toEqual(3);
                expect(nodes[0].vComponents[0] instanceof Literal).toEqual(true);
                expect(nodes[0].vComponents[1] instanceof Literal).toEqual(true);
                expect(nodes[0].vComponents[2] instanceof Literal).toEqual(true);
                expect(nodes[0].components).toEqual([56, 57, 58]);
            });
        });
    }
});
