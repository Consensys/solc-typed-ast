import expect from "expect";
import { ASTReader, compileJson, ContractDefinition, SourceUnit } from "../../../../../src";
import { ABIEncoderVersion } from "../../../../../src/types/abi";

describe("ContractDefinition (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/declarations/contract_050.json";

    let mainUnit: SourceUnit;
    let contracts: readonly ContractDefinition[];

    before(() => {
        const reader = new ASTReader();
        const { data } = compileJson(sample, "0.5.0", []);

        [mainUnit] = reader.read(data);

        contracts = mainUnit.vContracts;
    });

    it("Detect correct number of nodes", () => {
        expect(contracts.length).toEqual(3);
    });

    it("library A", () => {
        const contract = contracts[0];

        expect(contract).toBeDefined();
        expect(contract.id).toEqual(17);
        expect(contract.type).toEqual("ContractDefinition");
        expect(contract.kind).toEqual("library");
        expect(contract.name).toEqual("A");
        expect(contract.fullyImplemented).toEqual(true);
        expect(contract.scope).toEqual(mainUnit.id);
        expect(contract.vScope === mainUnit).toEqual(true);
        expect(contract.vConstructor === undefined).toEqual(true);

        expect(contract.vStructs.length).toEqual(0);
        expect(contract.vEvents.length).toEqual(0);
        expect(contract.vStateVariables.length).toEqual(0);
        expect(contract.vEnums.length).toEqual(0);
        expect(contract.vModifiers.length).toEqual(0);
        expect(contract.vFunctions.length).toEqual(1);

        expect(contract.vFunctions[0].id).toEqual(16);
        expect(contract.vFunctions[0].name).toEqual("add");
        expect(contract.vFunctions[0].implemented).toEqual(true);
        expect(contract.vFunctions[0].isConstructor).toEqual(false);
        expect(contract.vFunctions[0].canonicalSignature(ABIEncoderVersion.V1)).toEqual(
            "add(uint256,uint256)"
        );
        expect(contract.vFunctions[0].canonicalSignatureHash(ABIEncoderVersion.V1)).toEqual(
            "771602f7"
        );

        expect(contract.getChildren().length).toEqual(16);
    });

    it("interface B", () => {
        const contract = contracts[1];

        expect(contract).toBeDefined();
        expect(contract.id).toEqual(27);
        expect(contract.type).toEqual("ContractDefinition");
        expect(contract.kind).toEqual("interface");
        expect(contract.name).toEqual("B");
        expect(contract.fullyImplemented).toEqual(false);
        expect(contract.scope).toEqual(mainUnit.id);
        expect(contract.vScope === mainUnit).toEqual(true);
        expect(contract.vConstructor === undefined).toEqual(true);

        expect(contract.vStructs.length).toEqual(0);
        expect(contract.vEvents.length).toEqual(0);
        expect(contract.vStateVariables.length).toEqual(0);
        expect(contract.vEnums.length).toEqual(0);
        expect(contract.vModifiers.length).toEqual(0);
        expect(contract.vFunctions.length).toEqual(1);

        expect(contract.vFunctions[0].id).toEqual(26);
        expect(contract.vFunctions[0].name).toEqual("some");
        expect(contract.vFunctions[0].implemented).toEqual(false);
        expect(contract.vFunctions[0].isConstructor).toEqual(false);
        expect(contract.vFunctions[0].canonicalSignature(ABIEncoderVersion.V1)).toEqual(
            "some(uint256,uint256)"
        );
        expect(contract.vFunctions[0].canonicalSignatureHash(ABIEncoderVersion.V1)).toEqual(
            "cdb3deb6"
        );

        expect(contract.getChildren().length).toEqual(9);
    });

    it("contract C", () => {
        const contract = contracts[2];

        expect(contract).toBeDefined();
        expect(contract.id).toEqual(72);
        expect(contract.type).toEqual("ContractDefinition");
        expect(contract.kind).toEqual("contract");
        expect(contract.name).toEqual("C");
        expect(contract.fullyImplemented).toEqual(true);
        expect(contract.scope).toEqual(mainUnit.id);
        expect(contract.vScope === mainUnit).toEqual(true);

        expect(contract.vEvents.length).toEqual(1);

        expect(contract.vEvents[0].id).toEqual(33);
        expect(contract.vEvents[0].name).toEqual("Ev");

        expect(contract.vStructs.length).toEqual(1);

        expect(contract.vStructs[0].id).toEqual(36);
        expect(contract.vStructs[0].name).toEqual("St");

        expect(contract.vStateVariables.length).toEqual(1);

        expect(contract.vStateVariables[0].id).toEqual(45);
        expect(contract.vStateVariables[0].name).toEqual("val");

        expect(contract.vEnums.length).toEqual(1);

        expect(contract.vEnums[0].id).toEqual(40);
        expect(contract.vEnums[0].name).toEqual("En");

        expect(contract.vFunctions.length).toEqual(2);

        expect(contract.vFunctions[0].id).toEqual(56);
        expect(contract.vFunctions[0].name).toEqual("");
        expect(contract.vFunctions[0].implemented).toEqual(true);
        expect(contract.vFunctions[0].isConstructor).toEqual(true);
        expect(contract.vFunctions[0] === contract.vConstructor).toEqual(true);
        expect(contract.vFunctions[0].canonicalSignature(ABIEncoderVersion.V1)).toEqual("");
        expect(contract.vFunctions[0].canonicalSignatureHash(ABIEncoderVersion.V1)).toEqual("");

        expect(contract.vFunctions[1].id).toEqual(71);
        expect(contract.vFunctions[1].name).toEqual("some");
        expect(contract.vFunctions[1].implemented).toEqual(true);
        expect(contract.vFunctions[1].isConstructor).toEqual(false);
        expect(contract.vFunctions[1].canonicalSignature(ABIEncoderVersion.V1)).toEqual(
            "some(uint256,uint256)"
        );
        expect(contract.vFunctions[1].canonicalSignatureHash(ABIEncoderVersion.V1)).toEqual(
            "cdb3deb6"
        );

        expect(contract.vModifiers.length).toEqual(0);

        expect(contract.getChildren().length).toEqual(44);
    });
});
