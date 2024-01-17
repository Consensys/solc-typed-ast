import expect from "expect";
import { ASTReader, compileJson, ContractDefinition } from "../../../../../src";

describe("ImportDirective", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/meta/three_simple_contracts_0413.json"],
        ["0.5.0", "test/samples/solidity/meta/three_simple_contracts_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let contracts: readonly ContractDefinition[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const units = reader.read(data);

                contracts = units
                    .map((sourceUnit) => sourceUnit.vContracts)
                    .reduce((result, localContracts) => result.concat(localContracts), []);
            });

            it("Contract D is valid", () => {
                expect(contracts[0].name).toEqual("D");
                expect(contracts[0].linearizedBaseContracts).toEqual([11]);
                expect(contracts[0].vInheritanceSpecifiers.length).toEqual(0);

                expect(contracts[0].isSubclassOf(contracts[0])).toEqual(true);
            });

            it("Contract C is valid", () => {
                expect(contracts[1].name).toEqual("C");
                expect(contracts[1].linearizedBaseContracts).toEqual([22]);
                expect(contracts[1].vInheritanceSpecifiers.length).toEqual(0);

                expect(contracts[1].isSubclassOf(contracts[0])).toEqual(false);
                expect(contracts[1].isSubclassOf(contracts[1])).toEqual(true);
            });

            it("Contract B is valid", () => {
                expect(contracts[2].name).toEqual("B");
                expect(contracts[2].linearizedBaseContracts).toEqual([33, 22]);
                expect(contracts[2].vInheritanceSpecifiers.length).toEqual(1);

                expect(contracts[2].vInheritanceSpecifiers[0].vBaseType.name).toEqual("C");
                expect(contracts[2].vInheritanceSpecifiers[0].vArguments.length).toEqual(0);

                expect(contracts[2].isSubclassOf(contracts[0])).toEqual(false);
                expect(contracts[2].isSubclassOf(contracts[1])).toEqual(true);
                expect(contracts[2].isSubclassOf(contracts[2])).toEqual(true);
            });

            it("Contract A is valid", () => {
                expect(contracts[3].name).toEqual("A");
                expect(contracts[3].linearizedBaseContracts).toEqual([73, 11, 33, 22]);
                expect(contracts[3].vInheritanceSpecifiers.length).toEqual(2);

                expect(contracts[3].vInheritanceSpecifiers[0].vBaseType.name).toEqual("B");
                expect(contracts[3].vInheritanceSpecifiers[0].vArguments.length).toEqual(0);

                expect(contracts[3].vInheritanceSpecifiers[1].vBaseType.name).toEqual("D");
                expect(contracts[3].vInheritanceSpecifiers[1].vArguments.length).toEqual(0);

                expect(contracts[3].isSubclassOf(contracts[0])).toEqual(true);
                expect(contracts[3].isSubclassOf(contracts[1])).toEqual(true);
                expect(contracts[3].isSubclassOf(contracts[2])).toEqual(true);
                expect(contracts[3].isSubclassOf(contracts[3])).toEqual(true);
            });
        });
    }
});
