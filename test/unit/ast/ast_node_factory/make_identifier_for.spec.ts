import { expect } from "expect";
import {
    ASTNodeFactory,
    ContractKind,
    DataLocation,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    Identifier,
    Mutability,
    StateVariableVisibility
} from "../../../../src";
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

    it("StructDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeStructDefinition("Some", 0, "default", []);

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
            typeString: `type(struct ${target.canonicalName} storage pointer)`
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

    it("FunctionDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeFunctionDefinition(
            0,
            FunctionKind.Function,
            "Test",
            false,
            FunctionVisibility.Internal,
            FunctionStateMutability.View,
            false,
            factory.makeParameterList([
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "a",
                    0,
                    false,
                    DataLocation.Default,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "uint256"
                )
            ]),
            factory.makeParameterList([
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "b",
                    0,
                    false,
                    DataLocation.Default,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "uint256"
                )
            ]),
            []
        );

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 6,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: "function (uint256) view internal returns (uint256)"
        });
    });

    it("EventDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeEventDefinition(
            false,
            "Test",
            factory.makeParameterList([
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "a",
                    0,
                    false,
                    DataLocation.Default,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "uint256"
                )
            ])
        );

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 4,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: "function (uint256)"
        });
    });

    it("ErrorDefinition", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeErrorDefinition(
            "Test",
            factory.makeParameterList([
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "a",
                    0,
                    false,
                    DataLocation.Default,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "uint256"
                )
            ])
        );

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 4,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.name,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: "function (uint256)"
        });
    });

    it("ImportDirective with unit alias", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeImportDirective("some.sol", "some.sol", "x", [], 0, 0);

        const id = factory.makeIdentifierFor(target);

        verify(id, Identifier, {
            id: 2,
            type: "Identifier",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: target.unitAlias,
            referencedDeclaration: target.id,
            vReferencedDeclaration: target,
            typeString: "<missing>"
        });
    });

    it("ImportDirective without unit alias (expected to throw)", () => {
        const factory = new ASTNodeFactory();
        const target = factory.makeImportDirective("some.sol", "some.sol", "", [], 0, 0);

        expect(() => factory.makeIdentifierFor(target)).toThrow(
            'Target ImportDirective required to have valid "unitAlias"'
        );
    });
});
