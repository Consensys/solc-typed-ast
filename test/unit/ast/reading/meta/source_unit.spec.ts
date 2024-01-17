import expect from "expect";
import { ASTReader, compileJson, SourceUnit } from "../../../../../src";

describe("SourceUnit", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/meta/imports/A_0413.json"],
        ["0.5.0", "test/samples/solidity/meta/imports/A_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let units: SourceUnit[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);

                units = reader.read(data);
            });

            it("Detect correct number of nodes", () => {
                expect(units.length).toEqual(4);
            });

            it("Each source unit is valid", () => {
                const cases = new Map([
                    ["A.sol", [6, 2, ["A"]]],
                    ["lib/B.sol", [12, 2, ["B"]]],
                    ["lib2/C.sol", [19, 3, ["C"]]],
                    ["lib2/D.sol", [25, 2, ["D"]]]
                ]);

                let unitIndex = 0;

                for (const [suffix, [id, children, contracts]] of cases.entries()) {
                    const unit = units[unitIndex];

                    expect(unit.absolutePath.endsWith(suffix)).toEqual(true);
                    expect(unit.id).toEqual(id);
                    expect(unit.children.length).toEqual(children);
                    expect(unit.vContracts.map((contract) => contract.name)).toEqual(contracts);

                    unitIndex++;
                }
            });
        });
    }
});
