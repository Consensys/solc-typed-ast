import expect from "expect";
import { Assignment, ASTReader, compileJson, Identifier, Literal } from "../../../../../src";

describe("Assignment", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/expressions/assignment_0413.json"],
        ["0.5.0", "test/samples/solidity/expressions/assignment_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: Assignment[];

            const cases = [
                ["+=", 12, "1", 11],
                ["-=", 16, "2", 15],
                ["*=", 20, "20", 19],
                ["/=", 24, "2", 23],
                ["%=", 28, "5", 27],
                ["=", 32, "7", 31],
                ["&=", 36, "1", 35],
                ["|=", 40, "1", 39],
                ["^=", 44, "1", 43]
            ];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(Assignment);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(cases.length);
            });

            cases.forEach(([operator, id, value, valueId], index) => {
                it(`Operator ${operator}`, () => {
                    const assignment = nodes[index];

                    expect(assignment instanceof Assignment).toEqual(true);
                    expect(assignment.id).toEqual(id);

                    const l = assignment.vLeftHandSide as Identifier;

                    expect(l instanceof Identifier).toEqual(true);
                    expect(l.name).toEqual("b");

                    const r = assignment.vRightHandSide as Literal;

                    expect(r instanceof Literal).toEqual(true);
                    expect(r.id).toEqual(valueId);
                    expect(r.value).toEqual(value);
                });
            });
        });
    }
});
