import expect from "expect";
import {
    Assignment,
    ASTNode,
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    ExpressionStatement,
    ForStatement,
    FunctionDefinition,
    SourceUnit,
    UnaryOperation
} from "../../../../../src";

describe("ExpressionStatement (Solc 0.4.13)", () => {
    const sample = "test/samples/solidity/statements/expression_0413.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.4.13");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all EXPRESSION statements`, () => {
        expect(mainUnit.getChildrenByType(ExpressionStatement).length).toEqual(8);
    });

    it(`Check EXPRESSION statements in single()`, () => {
        const statements: ExpressionStatement[] = funcs[0].getChildrenByType(ExpressionStatement);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(9);
        expect(statements[0].src).toEqual("105:5:0");
        expect(statements[0].type).toEqual(ExpressionStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].id).toEqual(8);
        expect(statements[0].children[0].children.length).toEqual(2);
        expect(statements[0].children[0].type).toEqual(BinaryOperation.name);
        expect(statements[0].children[0] === statements[0].vExpression).toEqual(true);
    });

    it(`Check EXPRESSION statements in multiple()`, () => {
        const statements: ExpressionStatement[] = funcs[1].getChildrenByType(ExpressionStatement);

        expect(statements.length).toEqual(3);

        expect(statements[0].id).toEqual(31);
        expect(statements[0].src).toEqual("210:15:0");
        expect(statements[0].type).toEqual(ExpressionStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].id).toEqual(30);
        expect(statements[0].children[0].children.length).toEqual(2);
        expect(statements[0].children[0].type).toEqual(Assignment.name);
        expect(statements[0].children[0] === statements[0].vExpression).toEqual(true);

        expect(statements[1].id).toEqual(39);
        expect(statements[1].src).toEqual("236:13:0");
        expect(statements[1].type).toEqual(ExpressionStatement.name);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[1].children.length).toEqual(1);
        expect(statements[1].children[0].id).toEqual(38);
        expect(statements[1].children[0].children.length).toEqual(2);
        expect(statements[1].children[0].type).toEqual(Assignment.name);
        expect(statements[1].children[0] === statements[1].vExpression).toEqual(true);

        expect(statements[2].id).toEqual(47);
        expect(statements[2].src).toEqual("260:17:0");
        expect(statements[2].type).toEqual(ExpressionStatement.name);
        expect((statements[2].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[2].children.length).toEqual(1);
        expect(statements[2].children[0].id).toEqual(46);
        expect(statements[2].children[0].children.length).toEqual(2);
        expect(statements[2].children[0].type).toEqual(BinaryOperation.name);
        expect(statements[2].children[0] === statements[2].vExpression).toEqual(true);
    });

    it(`Check EXPRESSION statements in nested()`, () => {
        const statements: ExpressionStatement[] = funcs[2].getChildrenByType(ExpressionStatement);

        expect(statements.length).toEqual(4);

        expect(statements[0].id).toEqual(58);
        expect(statements[0].src).toEqual("346:5:0");
        expect(statements[0].type).toEqual(ExpressionStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(ForStatement.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].id).toEqual(57);
        expect(statements[0].children[0].children.length).toEqual(2);
        expect(statements[0].children[0].type).toEqual(Assignment.name);
        expect(statements[0].children[0] === statements[0].vExpression).toEqual(true);

        expect(statements[1].id).toEqual(64);
        expect(statements[1].src).toEqual("361:3:0");
        expect(statements[1].type).toEqual(ExpressionStatement.name);
        expect((statements[1].parent as ASTNode).type).toEqual(ForStatement.name);
        expect(statements[1].children.length).toEqual(1);
        expect(statements[1].children[0].id).toEqual(63);
        expect(statements[1].children[0].children.length).toEqual(1);
        expect(statements[1].children[0].type).toEqual(UnaryOperation.name);
        expect(statements[1].children[0] === statements[1].vExpression).toEqual(true);

        expect(statements[2].id).toEqual(71);
        expect(statements[2].src).toEqual("410:6:0");
        expect(statements[2].type).toEqual(ExpressionStatement.name);
        expect((statements[2].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[2].children.length).toEqual(1);
        expect(statements[2].children[0].id).toEqual(70);
        expect(statements[2].children[0].children.length).toEqual(2);
        expect(statements[2].children[0].type).toEqual(Assignment.name);
        expect(statements[2].children[0] === statements[2].vExpression).toEqual(true);

        expect(statements[3].id).toEqual(78);
        expect(statements[3].src).toEqual("451:3:0");
        expect(statements[3].type).toEqual(ExpressionStatement.name);
        expect((statements[3].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[3].children.length).toEqual(1);
        expect(statements[3].children[0].id).toEqual(77);
        expect(statements[3].children[0].children.length).toEqual(1);
        expect(statements[3].children[0].type).toEqual(UnaryOperation.name);
        expect(statements[3].children[0] === statements[3].vExpression).toEqual(true);
    });
});
