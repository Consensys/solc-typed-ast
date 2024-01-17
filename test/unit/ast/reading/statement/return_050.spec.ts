import expect from "expect";
import {
    ASTNode,
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    FunctionDefinition,
    Identifier,
    Literal,
    ParameterList,
    Return,
    SourceUnit,
    TupleExpression
} from "../../../../../src";

describe("Return (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/return_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all RETURN statements`, () => {
        expect(mainUnit.getChildrenByType(Return).length).toEqual(5);
    });

    it(`Check RETURN statements in singleValueReturn()`, () => {
        const statements: Return[] = funcs[0].getChildrenByType(Return);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(7);
        expect(statements[0].src).toEqual("113:8:0");
        expect(statements[0].type).toEqual(Return.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].type).toEqual(Literal.name);
        expect(statements[0].functionReturnParameters).toEqual(5);

        expect((statements[0].vFunctionReturnParameters as ASTNode).type).toEqual(
            ParameterList.name
        );
        expect((statements[0].vFunctionReturnParameters as ASTNode).id).toEqual(5);
    });

    it(`Check RETURN statements in tupleValueReturn()`, () => {
        const statements: Return[] = funcs[1].getChildrenByType(Return);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(27);
        expect(statements[0].src).toEqual("262:13:0");
        expect(statements[0].type).toEqual(Return.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].type).toEqual(TupleExpression.name);
        expect(statements[0].functionReturnParameters).toEqual(15);

        expect((statements[0].vFunctionReturnParameters as ASTNode).type).toEqual(
            ParameterList.name
        );
        expect((statements[0].vFunctionReturnParameters as ASTNode).id).toEqual(15);
    });

    it(`Check RETURN statements in multipleReturns()`, () => {
        const statements: Return[] = funcs[2].getChildrenByType(Return);

        expect(statements.length).toEqual(2);

        expect(statements[0].id).toEqual(54);
        expect(statements[0].src).toEqual("429:12:0");
        expect(statements[0].type).toEqual(Return.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].type).toEqual(BinaryOperation.name);
        expect(statements[0].functionReturnParameters).toEqual(35);

        expect((statements[0].vFunctionReturnParameters as ASTNode).type).toEqual(
            ParameterList.name
        );
        expect((statements[0].vFunctionReturnParameters as ASTNode).id).toEqual(35);

        expect(statements[1].id).toEqual(60);
        expect(statements[1].src).toEqual("476:8:0");
        expect(statements[1].type).toEqual(Return.name);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[1].children.length).toEqual(1);
        expect(statements[1].children[0].type).toEqual(Identifier.name);
        expect(statements[1].functionReturnParameters).toEqual(35);

        expect((statements[1].vFunctionReturnParameters as ASTNode).type).toEqual(
            ParameterList.name
        );
        expect((statements[1].vFunctionReturnParameters as ASTNode).id).toEqual(35);
    });

    it(`Check RETURN statements in emptyReturn()`, () => {
        const statements: Return[] = funcs[3].getChildrenByType(Return);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(65);
        expect(statements[0].src).toEqual("537:7:0");
        expect(statements[0].type).toEqual(Return.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
        expect(statements[0].functionReturnParameters).toEqual(64);

        expect((statements[0].vFunctionReturnParameters as ASTNode).type).toEqual(
            ParameterList.name
        );
        expect((statements[0].vFunctionReturnParameters as ASTNode).id).toEqual(64);
    });
});
