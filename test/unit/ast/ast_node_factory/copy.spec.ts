import expect from "expect";
import {
    assert,
    ASTNodeFactory,
    BinaryOperation,
    Block,
    ContractKind,
    DataLocation,
    ElementaryTypeName,
    EnumDefinition,
    EnumValue,
    EventDefinition,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    ImportDirective,
    Literal,
    LiteralKind,
    ModifierDefinition,
    Mutability,
    OverrideSpecifier,
    ParameterList,
    PragmaDirective,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    StructuredDocumentation,
    TimeUnit,
    UnaryOperation,
    VariableDeclaration
} from "../../../../src";
import { verify } from "../common";

describe("ASTNodeFactory.copy()", () => {
    it("EnumDefinition", () => {
        const factory = new ASTNodeFactory();

        const value = factory.makeEnumValue("MyValue");
        const docs = factory.makeStructuredDocumentation("Doc string");
        const definition = factory.makeEnumDefinition("MyEnum", [value], docs);

        const defCopy = factory.copy(definition);
        const valCopy = defCopy.vMembers[0];
        const docsCopy = defCopy.documentation;

        expect(defCopy === definition).toBeFalsy();
        expect(valCopy === value).toBeFalsy();
        expect(docsCopy === docs).toBeFalsy();

        assert(
            docsCopy instanceof StructuredDocumentation,
            "Expected StructuredDocumentation instance"
        );

        verify(defCopy, EnumDefinition, {
            id: 6,
            type: "EnumDefinition",
            src: "0:0:0",
            children: [docsCopy, valCopy],
            raw: undefined,

            name: "MyEnum",
            canonicalName: "MyEnum",
            vMembers: [valCopy],

            vScope: undefined
        });

        verify(valCopy, EnumValue, {
            id: 4,
            type: "EnumValue",
            src: "0:0:0",
            children: [],
            raw: undefined,

            name: "MyValue"
        });

        verify(docsCopy, StructuredDocumentation, {
            id: 5,
            type: "StructuredDocumentation",
            src: "0:0:0",
            children: [],
            raw: undefined,

            text: "Doc string"
        });
    });

    it("EventDefinition", () => {
        const factory = new ASTNodeFactory();

        const parameters = factory.makeParameterList([]);
        const docs = factory.makeStructuredDocumentation("Doc string");
        const event = factory.makeEventDefinition(false, "MyEvent", parameters, docs);

        const eventCopy = factory.copy(event);
        const paramsCopy = eventCopy.vParameters;
        const docsCopy = eventCopy.documentation;

        expect(eventCopy === event).toBeFalsy();
        expect(paramsCopy === parameters).toBeFalsy();
        expect(docsCopy === docs).toBeFalsy();

        assert(
            docsCopy instanceof StructuredDocumentation,
            "Expected StructuredDocumentation instance"
        );

        verify(eventCopy, EventDefinition, {
            id: 6,
            type: "EventDefinition",
            src: "0:0:0",
            children: [docsCopy, paramsCopy],
            raw: undefined,

            anonymous: false,
            name: "MyEvent",

            vScope: undefined
        });

        verify(docsCopy, StructuredDocumentation, {
            id: 5,
            type: "StructuredDocumentation",
            src: "0:0:0",
            children: [],
            raw: undefined,

            text: "Doc string"
        });
    });

    it("FunctionDefinition", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const contract = factory.makeContractDefinition(
            "Test",
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
        const original = factory.makeFunctionDefinition(
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

        const props: any = {
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
        } as Partial<FunctionDefinition>;

        verify(original, FunctionDefinition, props);

        const clone = factory.copy(original);

        props.id = 12;
        props.children = clone.children;

        [props.vParameters, props.vOverrideSpecifier, props.vReturnParameters, props.vBody] =
            clone.children as [OverrideSpecifier, ParameterList, ParameterList, Block];

        for (let i = 0; i < original.children.length; i++) {
            const originalChild = original.children[i];
            const cloneChild = clone.children[i];

            expect(originalChild === cloneChild).toBeFalsy();
            expect(cloneChild).toBeInstanceOf(originalChild.constructor);
            expect(cloneChild.id > originalChild.id);
        }

        verify(clone, FunctionDefinition, props);
    });

    it("ModifierDefinition", () => {
        const factory = new ASTNodeFactory();

        const parameters = factory.makeParameterList([]);
        const override = factory.makeOverrideSpecifier([]);
        const body = factory.makeBlock([]);
        const original = factory.makeModifierDefinition(
            "myMod",
            false,
            FunctionVisibility.Internal,
            parameters,
            override,
            body,
            "doc string"
        );

        const props: any = {
            id: 4,
            type: "ModifierDefinition",
            src: "0:0:0",
            children: [parameters, override, body],
            raw: undefined,
            name: "myMod",
            virtual: false,
            visibility: FunctionVisibility.Internal,
            vParameters: parameters,
            vOverrideSpecifier: override,
            vBody: body,
            documentation: "doc string",

            vScope: undefined
        } as Partial<ModifierDefinition>;

        verify(original, ModifierDefinition, props);

        const clone = factory.copy(original);

        props.id = 8;
        props.children = clone.children;

        [props.vParameters, props.vOverrideSpecifier, props.vBody] = clone.children as [
            ParameterList,
            OverrideSpecifier,
            Block
        ];

        for (let i = 0; i < original.children.length; i++) {
            const originalChild = original.children[i];
            const cloneChild = clone.children[i];

            expect(originalChild === cloneChild).toBeFalsy();
            expect(cloneChild).toBeInstanceOf(originalChild.constructor);
            expect(cloneChild.id > originalChild.id);
        }

        verify(clone, ModifierDefinition, props);
    });

    it("StructDefinition", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const contract = factory.makeContractDefinition(
            "Test",
            unit.id,
            ContractKind.Contract,
            false,
            true,
            [],
            [],
            [],
            "doc string"
        );

        const docs = factory.makeStructuredDocumentation("Struct doc string");
        const struct = factory.makeStructDefinition(
            "MyStruct",
            contract.id,
            FunctionVisibility.Internal,
            [],
            docs
        );

        const memberType = factory.makeElementaryTypeName("uint8", "uint8");
        const member = factory.makeVariableDeclaration(
            false,
            false,
            "a",
            struct.id,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Mutable,
            memberType.typeString,
            undefined,
            memberType
        );

        struct.appendChild(member);

        const structClone = factory.copy(struct);
        const docsClone = structClone.documentation;
        const memberClone = structClone.vMembers[0];
        const memberTypeClone = memberClone.vType;

        assert(
            memberTypeClone instanceof ElementaryTypeName,
            "Expected ElementaryTypeName instance"
        );

        assert(
            docsClone instanceof StructuredDocumentation,
            "Expected StructuredDocumentation instance"
        );

        expect(structClone === struct).toBeFalsy();
        expect(docsClone === docs).toBeFalsy();
        expect(memberClone === member).toBeFalsy();
        expect(memberTypeClone === memberType).toBeFalsy();

        verify(structClone, StructDefinition, {
            id: 10,
            type: "StructDefinition",
            src: "0:0:0",
            children: [docsClone, memberClone],
            raw: undefined,

            name: "MyStruct",
            canonicalName: "Test.MyStruct",
            vMembers: [memberClone],

            vScope: contract
        });

        verify(docsClone, StructuredDocumentation, {
            id: 9,
            type: "StructuredDocumentation",
            src: "0:0:0",
            children: [],
            raw: undefined,

            text: "Struct doc string"
        });

        verify(memberClone, VariableDeclaration, {
            id: 8,
            type: "VariableDeclaration",
            src: "0:0:0",
            children: [memberTypeClone],
            raw: undefined,

            constant: false,
            indexed: false,
            name: "a",
            scope: structClone.id,
            stateVariable: false,
            storageLocation: DataLocation.Default,
            visibility: StateVariableVisibility.Default,
            mutability: Mutability.Mutable,
            typeString: memberTypeClone.typeString,
            vType: memberTypeClone
        });

        verify(memberTypeClone, ElementaryTypeName, {
            id: 7,
            type: "ElementaryTypeName",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint8",
            name: "uint8"
        });
    });

    it("SourceUnit", () => {
        const factory = new ASTNodeFactory();

        const unit = factory.makeSourceUnit("sample.sol", 0, "path/to/sample.sol", new Map());
        const importedUnit = factory.makeSourceUnit("other.sol", 0, "path/to/other.sol", new Map());
        const pragmaDirective = factory.makePragmaDirective(["solidity", "0.5", ".10"]);
        const importDirective = factory.makeImportDirective(
            "other.sol",
            "path/to/other.sol",
            "",
            [],
            unit.id,
            importedUnit.id
        );

        unit.appendChild(pragmaDirective);
        unit.appendChild(importDirective);

        const unitClone = factory.copy(unit);
        const [pragmaClone, importClone] = unitClone.children as [PragmaDirective, ImportDirective];

        expect(unitClone === unit).toBeFalsy();
        expect(pragmaClone === pragmaDirective).toBeFalsy();
        expect(importClone === importDirective).toBeFalsy();

        verify(unitClone, SourceUnit, {
            id: 7,
            type: "SourceUnit",
            src: "0:0:0",
            children: [pragmaClone, importClone],
            raw: undefined,

            sourceEntryKey: "sample.sol",
            sourceListIndex: 0,
            absolutePath: "path/to/sample.sol",
            exportedSymbols: new Map()
        });

        verify(pragmaClone, PragmaDirective, {
            id: 5,
            type: "PragmaDirective",
            src: "0:0:0",
            children: [],
            raw: undefined,

            literals: ["solidity", "0.5", ".10"],
            vIdentifier: "solidity",
            vValue: "0.5.10"
        });

        verify(importClone, ImportDirective, {
            id: 6,
            type: "ImportDirective",
            src: "0:0:0",
            children: [],
            raw: undefined,

            file: "other.sol",
            absolutePath: "path/to/other.sol",
            unitAlias: "",
            symbolAliases: [],
            scope: unitClone.id,
            sourceUnit: importedUnit.id,

            vScope: unitClone,
            vSourceUnit: importedUnit
        });
    });

    it("Literal", () => {
        const factory = new ASTNodeFactory();

        const literal = factory.makeLiteral(
            "uint8",
            LiteralKind.Number,
            "01",
            "1",
            TimeUnit.Seconds
        );

        const literalClone = factory.copy(literal);

        expect(literalClone === literal).toBeFalsy();

        verify(literalClone, Literal, {
            id: 2,
            type: "Literal",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint8",
            kind: LiteralKind.Number,
            hexValue: "01",
            value: "1",
            subdenomination: TimeUnit.Seconds
        });
    });

    it("UnaryOperation", () => {
        const factory = new ASTNodeFactory();

        const expr = factory.makeLiteral("uint8", LiteralKind.Number, "01", "1", TimeUnit.Seconds);
        const operation = factory.makeUnaryOperation(expr.typeString, true, "-", expr);

        const operationClone = factory.copy(operation);
        const exprClone = operationClone.vSubExpression;

        assert(exprClone instanceof Literal, "Expected Literal instance");

        expect(operationClone === operation).toBeFalsy();
        expect(exprClone === expr).toBeFalsy();

        verify(operationClone, UnaryOperation, {
            id: 4,
            type: "UnaryOperation",
            src: "0:0:0",
            children: [exprClone],
            raw: undefined,

            typeString: "uint8",
            prefix: true,
            operator: "-",

            vSubExpression: exprClone
        });

        verify(exprClone, Literal, {
            id: 3,
            type: "Literal",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint8",
            kind: LiteralKind.Number,
            hexValue: "01",
            value: "1",
            subdenomination: TimeUnit.Seconds
        });
    });

    it("BinaryOperation", () => {
        const factory = new ASTNodeFactory();

        const right = factory.makeLiteral("uint8", LiteralKind.Number, "01", "1");
        const left = factory.makeLiteral("uint8", LiteralKind.Number, "02", "2");

        const operation = factory.makeBinaryOperation(right.typeString, "+", right, left);

        const operationClone = factory.copy(operation);
        const leftClone = operationClone.vLeftExpression;
        const rightClone = operationClone.vRightExpression;

        assert(leftClone instanceof Literal, "Expected Literal instance");
        assert(rightClone instanceof Literal, "Expected Literal instance");

        expect(operationClone === operation).toBeFalsy();
        expect(leftClone === left).toBeFalsy();
        expect(rightClone === right).toBeFalsy();

        verify(operationClone, BinaryOperation, {
            id: 6,
            type: "BinaryOperation",
            src: "0:0:0",
            children: [leftClone, rightClone],
            raw: undefined,

            typeString: "uint8",
            operator: "+",

            vLeftExpression: leftClone,
            vRightExpression: rightClone
        });

        verify(leftClone, Literal, {
            id: 4,
            type: "Literal",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint8",
            kind: LiteralKind.Number,
            hexValue: "01",
            value: "1"
        });

        verify(rightClone, Literal, {
            id: 5,
            type: "Literal",
            src: "0:0:0",
            children: [],
            raw: undefined,

            typeString: "uint8",
            kind: LiteralKind.Number,
            hexValue: "02",
            value: "2"
        });
    });
});
