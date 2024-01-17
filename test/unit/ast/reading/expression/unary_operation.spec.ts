import expect from "expect";
import { satisfies } from "semver";
import { ASTReader, compileJson, Identifier, UnaryOperation } from "../../../../../src";

describe("UnaryOperation", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/expressions/unary_operation_0413.json"],
        ["0.5.0", "test/samples/solidity/expressions/unary_operation_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: UnaryOperation[];

            const cases = [
                ["-", 13, 12],
                ["~", 18, 17],
                ["delete", 22, 21],
                ["!", 26, 25],
                ["+", 31, 30]
            ];

            if (!satisfies(version, "0.4")) {
                cases.pop();
            }

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(UnaryOperation);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(cases.length);
            });

            cases.forEach(([operator, id, subId], index) => {
                it(`Operator ${operator}`, () => {
                    const operation = nodes[index];

                    expect(operation instanceof UnaryOperation).toEqual(true);
                    expect(operation.id).toEqual(id);

                    const sub = operation.vSubExpression as Identifier;

                    expect(sub instanceof Identifier).toEqual(true);
                    expect(sub.id).toEqual(subId);
                });
            });
        });
    }
});
