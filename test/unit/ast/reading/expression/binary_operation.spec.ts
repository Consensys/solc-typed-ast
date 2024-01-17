import expect from "expect";
import { satisfies } from "semver";
import { ASTReader, BinaryOperation, compileJson, Identifier, Literal } from "../../../../../src";

describe("BinaryOperation", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/expressions/binary_operation_0413.json"],
        ["0.5.0", "test/samples/solidity/expressions/binary_operation_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: BinaryOperation[];

            const cases = [
                ["+", 10, "1", 9],
                ["-", 16, "2", 15],
                ["*", 22, "20", 21],
                ["/", 28, "2", 27],
                ["%", 34, "5", 33],

                ["&", 40, "1", 39],
                ["|", 46, "1", 45],
                ["^", 52, "1", 51],
                ["**", 58, "2", 57]
            ];

            if (satisfies(version, "0.4")) {
                cases.pop();
            }

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(BinaryOperation);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(cases.length);
            });

            cases.forEach(([operator, id, value, valueId], index) => {
                it(`Operator ${operator}`, () => {
                    const operation = nodes[index];

                    expect(operation instanceof BinaryOperation).toEqual(true);
                    expect(operation.id).toEqual(id);

                    const l = operation.vLeftExpression as Identifier;

                    expect(l instanceof Identifier).toEqual(true);
                    expect(l.name).toEqual("b");

                    const r = operation.vRightExpression as Literal;

                    expect(r instanceof Literal).toEqual(true);
                    expect(r.id).toEqual(valueId);
                    expect(r.value).toEqual(value);
                });
            });
        });
    }
});
