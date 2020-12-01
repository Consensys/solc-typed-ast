import {
    ASTNode,
    ASTNodeFactory,
    ContractDefinition,
    ContractKind,
    DataLocation,
    ElementaryTypeNameExpression,
    EnumDefinition,
    EnumValue,
    EventDefinition,
    Expression,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    LiteralKind,
    ModifierDefinition,
    Mutability,
    PragmaDirective,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    VariableDeclaration
} from "../../../../src";
import { verify } from "../common";

describe("ASTNodeFactory.make*()", () => {
    it("makeNode()", () => {
        const factory = new ASTNodeFactory();
        const node = factory.makeNode();

        verify(node, ASTNode, {
            id: 1,
            type: "ASTNode",
            src: "0:0:0",
            children: [],
            raw: undefined
        });
    });

    it("makeSourceUnit()", () => {
        const factory = new ASTNodeFactory();
        const exportedSymbols = new Map();
        const node = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", exportedSymbols);

        verify(node, SourceUnit, {
            id: 1,
            type: "SourceUnit",
            src: "0:0:0",
            children: [],
            raw: undefined,

            sourceEntryKey: "sample.sol",
            sourceListIndex: 0,
            absolutePath: "path/to/sample.sol",
            exportedSymbols: exportedSymbols
        });
    });

    it("makePragmaDirective()", () => {
        const factory = new ASTNodeFactory();
        const node = factory.makePragmaDirective(["solidity", "0.4", ".25"]);

        verify(node, PragmaDirective, {
            id: 1,
            type: "PragmaDirective",
            src: "0:0:0",
            children: [],
            raw: undefined,

            literals: ["solidity", "0.4", ".25"],
            vIdentifier: "solidity",
            vValue: "0.4.25"
        });
    });

    it("makeContractDefinition()", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const node = factory.makeContractDefinition(
            "A",
            unit.id,
            ContractKind.Contract,
            false,
            true,
            [],
            "doc string"
        );

        verify(node, ContractDefinition, {
            id: 2,
            type: "ContractDefinition",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: "A",
            scope: unit.id,
            kind: ContractKind.Contract,
            abstract: false,
            fullyImplemented: true,
            linearizedBaseContracts: [],
            documentation: "doc string",

            vScope: unit
        });
    });

    it("makeEnumDefinition()", () => {
        const factory = new ASTNodeFactory();
        const value = factory.makeEnumValue("MyValue");
        const node = factory.makeEnumDefinition("MyEnum", "MyContract.MyEnum", [value]);

        verify(node, EnumDefinition, {
            id: 2,
            type: "EnumDefinition",
            src: "0:0:0",
            children: [value],
            raw: undefined,

            name: "MyEnum",
            canonicalName: "MyContract.MyEnum",
            vMembers: [value]
        });
    });

    it("makeEnumValue()", () => {
        const factory = new ASTNodeFactory();
        const node = factory.makeEnumValue("A");

        verify(node, EnumValue, {
            id: 1,
            type: "EnumValue",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: "A"
        });
    });

    it("makeEventDefinition()", () => {
        const factory = new ASTNodeFactory();
        const parameters = factory.makeParameterList([]);
        const node = factory.makeEventDefinition(false, "MyEvent", parameters, "doc string");

        verify(node, EventDefinition, {
            id: 2,
            type: "EventDefinition",
            src: "0:0:0",
            children: [parameters],
            raw: undefined,

            anonymous: false,
            name: "MyEvent",
            vParameters: parameters,
            documentation: "doc string"
        });
    });

    it("makeFunctionDefinition()", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const contract = factory.makeContractDefinition(
            "A",
            unit.id,
            ContractKind.Contract,
            false,
            true,
            [],
            "doc string"
        );

        const parameters = factory.makeParameterList([]);
        const returns = factory.makeParameterList([]);
        const override = factory.makeOverrideSpecifier([]);
        const body = factory.makeBlock([]);
        const node = factory.makeFunctionDefinition(
            contract.id,
            FunctionKind.Function,
            "myFunction",
            false,
            FunctionVisibility.Public,
            FunctionStateMutability.NonPayable,
            false,
            parameters,
            returns,
            [],
            override,
            body,
            "doc string"
        );

        verify(node, FunctionDefinition, {
            id: 7,
            type: "FunctionDefinition",
            src: "0:0:0",
            children: [override, parameters, returns, body],
            raw: undefined,

            implemented: true,
            scope: 2,
            kind: FunctionKind.Function,
            name: "myFunction",
            virtual: false,
            visibility: FunctionVisibility.Public,
            stateMutability: FunctionStateMutability.NonPayable,
            isConstructor: false,
            vParameters: parameters,
            vReturnParameters: returns,
            vOverrideSpecifier: override,
            vModifiers: [],
            vBody: body,
            documentation: "doc string",

            vScope: contract
        });
    });

    it("makeModifierDefinition()", () => {
        const factory = new ASTNodeFactory();

        const parameters = factory.makeParameterList([]);
        const override = factory.makeOverrideSpecifier([]);
        const body = factory.makeBlock([]);
        const node = factory.makeModifierDefinition(
            "myModifier",
            false,
            "internal",
            parameters,
            override,
            body,
            "doc string"
        );

        verify(node, ModifierDefinition, {
            id: 4,
            type: "ModifierDefinition",
            src: "0:0:0",
            children: [parameters, override, body],
            raw: undefined,

            name: "myModifier",
            virtual: false,
            visibility: "internal",
            vParameters: parameters,
            vOverrideSpecifier: override,
            vBody: body,
            documentation: "doc string"
        });
    });

    it("makeStructDefinition()", () => {
        const factory = new ASTNodeFactory();
        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const node = factory.makeStructDefinition(
            "MyStruct",
            "MyContract.MyStruct",
            unit.id,
            "internal",
            []
        );

        verify(node, StructDefinition, {
            id: 2,
            type: "StructDefinition",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: "MyStruct",
            canonicalName: "MyContract.MyStruct",
            scope: unit.id,
            visibility: "internal",
            vMembers: [],

            vScope: unit
        });
    });

    it("makeVariableDeclaration()", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const contract = factory.makeContractDefinition(
            "A",
            unit.id,
            ContractKind.Contract,
            false,
            true,
            [],
            "doc string"
        );

        const type = factory.makeElementaryTypeName("uint8", "uint8");
        const value = factory.makeLiteral(type.typeString, LiteralKind.Number, "01", "1");
        const node = factory.makeVariableDeclaration(
            false,
            false,
            "v",
            contract.id,
            true,
            DataLocation.Default,
            StateVariableVisibility.Public,
            Mutability.Mutable,
            type.typeString,
            "doc string",
            type,
            undefined,
            value
        );

        verify(node, VariableDeclaration, {
            id: 5,
            type: "VariableDeclaration",
            src: "0:0:0",
            children: [type, value],
            raw: undefined,

            constant: false,
            indexed: false,
            name: "v",
            scope: contract.id,
            stateVariable: true,
            storageLocation: DataLocation.Default,
            visibility: StateVariableVisibility.Public,
            mutability: Mutability.Mutable,
            typeString: type.typeString,
            documentation: "doc string",
            vType: type,
            vValue: value,

            vScope: contract
        });
    });

    it("makeExpression", () => {
        const factory = new ASTNodeFactory();
        const node = factory.makeExpression("uint256");

        verify(node, Expression, {
            id: 1,
            type: "Expression",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint256"
        });
    });

    it("makeElementaryTypeNameExpression", () => {
        const factory = new ASTNodeFactory();
        const type = factory.makeElementaryTypeName("uint32", "uint32");
        const node = factory.makeElementaryTypeNameExpression("uint32", type);

        verify(node, ElementaryTypeNameExpression, {
            id: 2,
            type: "ElementaryTypeNameExpression",
            src: "0:0:0",
            children: [type],
            raw: undefined,

            typeString: type.typeString,
            typeName: type
        });
    });
});
