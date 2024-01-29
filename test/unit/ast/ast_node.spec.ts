import expect from "expect";
import fse from "fs-extra";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    FunctionDefinition,
    Literal,
    SourceUnit,
    stringToBytes
} from "../../../src";

describe("ASTNode", () => {
    const source = new Uint8Array(fse.readFileSync("test/samples/solidity/node.sol"));
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/node_0413.json"],
        ["0.5.0", "test/samples/solidity/node_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let mainUnit: SourceUnit;
            let nodes: ASTNode[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);

                [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildren(true);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(17);
            });

            it("root getter", () => {
                for (const node of nodes) {
                    expect(node.root === mainUnit).toEqual(true);
                }
            });

            it("getChildrenByTypeString()", () => {
                const byTypeString = mainUnit.getChildrenByTypeString("Literal");
                const byType = mainUnit.getChildrenByType(Literal);
                const mapperFn = (node: ASTNode) => node.print();

                expect(byTypeString.map(mapperFn)).toEqual(byType.map(mapperFn));
            });

            it("getParents()", () => {
                const deepest = nodes[nodes.length - 1];
                const parents = deepest.getParents();

                expect(parents.map((node) => node.id)).toEqual([10, 11, 12, 13, 14, 15, 16, 17]);
            });

            it("getClosestParentBySelector()", () => {
                const deepest = nodes[nodes.length - 1];
                const closest = deepest.getClosestParentBySelector(
                    (node) => node instanceof FunctionDefinition
                ) as ASTNode;

                expect(closest).toBeDefined();
                expect(closest instanceof FunctionDefinition).toEqual(true);
                expect(closest.id).toEqual(15);
                expect(closest.type).toEqual("FunctionDefinition");
            });

            it("getClosestParentByType()", () => {
                const deepest = nodes[nodes.length - 1];
                const closest = deepest.getClosestParentByType(FunctionDefinition) as ASTNode;

                expect(closest).toBeDefined();
                expect(closest instanceof FunctionDefinition).toEqual(true);
                expect(closest.id).toEqual(15);
                expect(closest.type).toEqual("FunctionDefinition");
            });

            it("getClosestParentByTypeString()", () => {
                const deepest = nodes[nodes.length - 1];
                const closest = deepest.getClosestParentByTypeString(
                    "FunctionDefinition"
                ) as ASTNode;

                expect(closest).toBeDefined();
                expect(closest instanceof FunctionDefinition).toEqual(true);
                expect(closest.id).toEqual(15);
                expect(closest.type).toEqual("FunctionDefinition");
            });

            it("getParentsBySelector()", () => {
                const deepest = nodes[nodes.length - 1];
                const parents = deepest.getParentsBySelector((node) => node instanceof Block);

                expect(parents.length).toEqual(2);

                expect(parents[0] instanceof Block).toEqual(true);
                expect(parents[0].id).toEqual(12);
                expect(parents[0].type).toEqual("Block");

                expect(parents[1] instanceof Block).toEqual(true);
                expect(parents[1].id).toEqual(14);
                expect(parents[1].type).toEqual("Block");
            });

            it("extractSourceFragment()", () => {
                const increment = nodes[nodes.length - 2];

                expect(increment.extractSourceFragment(source)).toEqual(stringToBytes("a++"));
            });
        });
    }
});
