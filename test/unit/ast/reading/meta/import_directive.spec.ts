import expect from "expect";
import { ASTReader, compileJson, SourceUnit } from "../../../../../src";

describe("ImportDirective", () => {
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

            it("Detect correct number of SourceUnit nodes", () => {
                expect(units.length).toEqual(4);
            });

            it("Each SourceUnit have valid ImportDirective nodes", () => {
                const cases = new Map([
                    ["A.sol", ["./lib/B.sol"]],
                    ["lib/B.sol", ["../lib2/C.sol"]],
                    ["lib2/C.sol", ["./D.sol", "../A.sol"]],
                    ["lib2/D.sol", ["../A.sol"]]
                ]);

                let unitIndex = 0;

                for (const [suffix, imports] of cases.entries()) {
                    const unit = units[unitIndex];

                    expect(unit.absolutePath.endsWith(suffix)).toEqual(true);

                    const nodes = unit.vImportDirectives;

                    expect(nodes.length).toEqual(imports.length);

                    imports.forEach((importPath, importIndex) => {
                        const node = nodes[importIndex];

                        expect(node.vScope === unit).toEqual(true);
                        expect(node.file).toEqual(importPath);
                        expect(node.unitAlias).toEqual("");
                        expect(node.symbolAliases).toHaveLength(0);
                    });

                    unitIndex++;
                }
            });
        });
    }
});
