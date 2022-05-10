import { expect } from "expect";
import { ASTNodeFactory, ContractKind, Identifier } from "../../../../src";
import { verify } from "../common";

describe("ASTNodeFactory.makeIdentifierFor()", () => {
    it("ContractDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeContractDefinition(
            "Test",
            0,
            ContractKind.Contract,
            false,
            true,
            [],
            []
        );

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 2,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: `type(contract ${target.name})`
        });
    });

    it("EnumDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeEnumDefinition("Some", []);

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 2,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: `type(enum ${target.canonicalName})`
        });
    });

    it("UserDefinedValueTypeDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeUserDefinedValueTypeDefinition(
            "Some",
            factory.makeElementaryTypeName("uint256", "uint256")
        );

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 3,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: `type(${target.canonicalName})`
        });
    });

    it("UncheckedBlock (expected to throw)", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeUncheckedBlock([]);

        expect(() => factory.makeIdentifierFor(target as any)).toThrow(
            "ASTNodeFactory.makeIdentifierFor(): Unable to compose typeString for supplied target"
        );
    });
});
