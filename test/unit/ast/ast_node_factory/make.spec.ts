import {
    ASTNodeFactory,
    Break,
    Conditional,
    Continue,
    ContractDefinition,
    ContractKind,
    DataLocation,
    ElementaryTypeNameExpression,
    EnumDefinition,
    EnumValue,
    ErrorDefinition,
    EventDefinition,
    ExpressionStatement,
    ExternalReferenceType,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    Identifier,
    LiteralKind,
    ModifierDefinition,
    Mutability,
    PlaceholderStatement,
    PragmaDirective,
    Return,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    Throw,
    TupleExpression,
    UserDefinedValueTypeDefinition,
    VariableDeclaration
} from "../../../../src";
import { verify } from "../common";

describe("ASTNodeFactory.make*()", () => {
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
            [],
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
        const node = factory.makeEnumDefinition("MyEnum", [value]);

        verify(node, EnumDefinition, {
            id: 2,
            type: "EnumDefinition",
            src: "0:0:0",
            children: [value],
            raw: undefined,

            name: "MyEnum",
            canonicalName: "MyEnum",
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

    it("makeErrorDefinition()", () => {
        const factory = new ASTNodeFactory();
        const parameters = factory.makeParameterList([]);
        const node = factory.makeErrorDefinition("MyError", parameters, "doc string");

        verify(node, ErrorDefinition, {
            id: 2,
            type: "ErrorDefinition",
            src: "0:0:0",
            children: [parameters],
            raw: undefined,

            name: "MyError",
            vParameters: parameters,
            documentation: "doc string"
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
            [],
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
            children: [parameters, override, returns, body],
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
        const node = factory.makeStructDefinition("MyStruct", unit.id, "internal", []);

        verify(node, StructDefinition, {
            id: 2,
            type: "StructDefinition",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: "MyStruct",
            canonicalName: "MyStruct",
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
            [],
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

    it("makeElementaryTypeNameExpression()", () => {
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

    it("makeReturn()", () => {
        const factory = new ASTNodeFactory();

        const type = factory.makeElementaryTypeName("uint32", "uint32");
        const variable = factory.makeVariableDeclaration(
            false,
            false,
            "v",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Mutable,
            type.typeString,
            undefined,
            type,
            undefined,
            undefined
        );

        const parameters = factory.makeParameterList([variable]);
        const expression = factory.makeLiteral(type.typeString, LiteralKind.Number, "ff", "255");
        const node = factory.makeReturn(parameters.id, expression);

        verify(node, Return, {
            id: 5,
            type: "Return",
            src: "0:0:0",
            children: [expression],
            raw: undefined,

            vExpression: expression,
            vFunctionReturnParameters: parameters
        });
    });

    it("makePlaceholderStatement()", () => {
        const factory = new ASTNodeFactory();

        const node = factory.makePlaceholderStatement();

        verify(node, PlaceholderStatement, {
            id: 1,
            type: "PlaceholderStatement",
            src: "0:0:0"
        });
    });

    it("makeThrow()", () => {
        const factory = new ASTNodeFactory();

        const node = factory.makeThrow();

        verify(node, Throw, {
            id: 1,
            type: "Throw",
            src: "0:0:0"
        });
    });

    it("makeContinue()", () => {
        const factory = new ASTNodeFactory();

        const node = factory.makeContinue();

        verify(node, Continue, {
            id: 1,
            type: "Continue",
            src: "0:0:0"
        });
    });

    it("makeBreak()", () => {
        const factory = new ASTNodeFactory();

        const node = factory.makeBreak();

        verify(node, Break, {
            id: 1,
            type: "Break",
            src: "0:0:0"
        });
    });

    it("makeIdentifier()", () => {
        const factory = new ASTNodeFactory();

        const type = factory.makeElementaryTypeName("uint32", "uint32");
        const variable = factory.makeVariableDeclaration(
            false,
            false,
            "v",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Mutable,
            type.typeString,
            undefined,
            type,
            undefined,
            undefined
        );

        const node = factory.makeIdentifier(variable.typeString, variable.name, variable.id);

        verify(node, Identifier, {
            id: 3,
            type: "Identifier",
            src: "0:0:0",

            name: variable.name,
            referencedDeclaration: variable.id,
            typeString: variable.typeString,

            vReferencedDeclaration: variable,
            vIdentifierType: ExternalReferenceType.UserDefined
        });
    });

    it("makeTupleExpression()", () => {
        const factory = new ASTNodeFactory();

        const expr1 = factory.makeLiteral("uint256", LiteralKind.Number, "01", "1");
        const expr2 = factory.makeLiteral("bool", LiteralKind.Bool, "00", "false");

        const components = [expr1, null, expr2];
        const typeString = `tuple(${expr1.typeString},,${expr2.typeString})`;

        const node = factory.makeTupleExpression(typeString, false, components);

        verify(node, TupleExpression, {
            id: 3,
            type: "TupleExpression",
            src: "0:0:0",
            children: [expr1, expr2],

            typeString: typeString,
            isInlineArray: false,
            components: [1, null, 2],
            vOriginalComponents: components,
            vComponents: [expr1, expr2]
        });
    });

    it("makeUserDefinedValueTypeDefinition()", () => {
        const factory = new ASTNodeFactory();

        const type = factory.makeElementaryTypeName("uint256", "uint256");
        const node = factory.makeUserDefinedValueTypeDefinition("MyCustomValeType", type);

        verify(node, UserDefinedValueTypeDefinition, {
            id: 2,
            type: "UserDefinedValueTypeDefinition",
            src: "0:0:0",
            children: [type]
        });
    });

    it("makeConditional()", () => {
        const factory = new ASTNodeFactory();

        const c = factory.makeLiteral("bool", LiteralKind.Bool, "00", "false");
        const t = factory.makeLiteral("uint256", LiteralKind.Number, "01", "1");
        const f = factory.makeLiteral("uint256", LiteralKind.Number, "02", "2");

        const node = factory.makeConditional("uint256", c, t, f);

        verify(node, Conditional, {
            id: 4,
            type: "Conditional",
            src: "0:0:0",
            children: [c, t, f],

            typeString: "uint256",
            vCondition: c,
            vTrueExpression: t,
            vFalseExpression: f
        });
    });

    it("makeExpressionStatement()", () => {
        const factory = new ASTNodeFactory();

        const expr = factory.makeLiteral("bool", LiteralKind.Bool, "01", "true");
        const node = factory.makeExpressionStatement(expr, "doc string");

        verify(node, ExpressionStatement, {
            id: 2,
            type: "ExpressionStatement",
            src: "0:0:0",
            children: [expr],

            documentation: "doc string"
        });
    });
});
