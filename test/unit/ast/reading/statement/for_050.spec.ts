import expect from "expect";
import {
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    ExpressionStatement,
    ForStatement,
    FunctionDefinition,
    SourceUnit,
    VariableDeclarationStatement
} from "../../../../../src";

describe("ForStatement (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/for_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all FOR statements`, () => {
        expect(mainUnit.getChildrenByType(ForStatement).length).toEqual(10);
    });

    it(`Check FOR statement with expression`, () => {
        const statements: ForStatement[] = funcs[0].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(22);
        expect(statement.src).toEqual("114:34:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(4);

        const initialization = statement.children[0];
        const condition = statement.children[1];
        const loopExpression = statement.children[2];
        const body = statement.children[3];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(11);
        expect(initialization.src).toEqual("119:9:0");
        expect(initialization.type).toEqual(VariableDeclarationStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(14);
        expect(condition.src).toEqual("130:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(17);
        expect(loopExpression.src).toEqual("138:3:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(21);
        expect(body.src).toEqual("142:6:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement with block`, () => {
        const statements: ForStatement[] = funcs[1].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(54);
        expect(statement.src).toEqual("241:80:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(4);

        const initialization = statement.children[0];
        const condition = statement.children[1];
        const loopExpression = statement.children[2];
        const body = statement.children[3];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(38);
        expect(initialization.src).toEqual("246:9:0");
        expect(initialization.type).toEqual(VariableDeclarationStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(41);
        expect(condition.src).toEqual("257:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(44);
        expect(loopExpression.src).toEqual("265:3:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(53);
        expect(body.src).toEqual("270:51:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (initialization without declaration)`, () => {
        const statements: ForStatement[] = funcs[2].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(89);
        expect(statement.src).toEqual("455:76:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(4);

        const initialization = statement.children[0];
        const condition = statement.children[1];
        const loopExpression = statement.children[2];
        const body = statement.children[3];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(73);
        expect(initialization.src).toEqual("460:5:0");
        expect(initialization.type).toEqual(ExpressionStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(76);
        expect(condition.src).toEqual("467:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(79);
        expect(loopExpression.src).toEqual("475:3:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(88);
        expect(body.src).toEqual("480:51:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (without initialization)`, () => {
        const statements: ForStatement[] = funcs[3].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(113);
        expect(statement.src).toEqual("635:28:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0];
        const loopExpression = statement.children[1];
        const body = statement.children[2];

        expect(statement.vInitializationExpression === undefined).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(104);
        expect(condition.src).toEqual("642:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(108);
        expect(loopExpression.src).toEqual("650:6:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(112);
        expect(body.src).toEqual("657:6:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (without loop expression)`, () => {
        const statements: ForStatement[] = funcs[4].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(134);
        expect(statement.src).toEqual("749:32:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(3);

        const initialization = statement.children[0];
        const condition = statement.children[1];
        const body = statement.children[2];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(125);
        expect(initialization.src).toEqual("754:9:0");
        expect(initialization.type).toEqual(VariableDeclarationStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(128);
        expect(condition.src).toEqual("765:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(statement.vLoopExpression === undefined).toEqual(true);

        expect(body.id).toEqual(133);
        expect(body.src).toEqual("773:8:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (without condition)`, () => {
        const statements: ForStatement[] = funcs[5].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(161);
        expect(statement.src).toEqual("866:118:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(3);

        const initialization = statement.children[0];
        const loopExpression = statement.children[1];
        const body = statement.children[2];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(146);
        expect(initialization.src).toEqual("871:9:0");
        expect(initialization.type).toEqual(VariableDeclarationStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(statement.vCondition === undefined).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(149);
        expect(loopExpression.src).toEqual("884:3:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(160);
        expect(body.src).toEqual("889:95:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (with loop expression only)`, () => {
        const statements: ForStatement[] = funcs[6].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(188);
        expect(statement.src).toEqual("1093:108:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(2);

        const loopExpression = statement.children[0];
        const body = statement.children[1];

        expect(statement.vInitializationExpression === undefined).toEqual(true);
        expect(statement.vCondition === undefined).toEqual(true);

        expect(loopExpression).toBeDefined();
        expect(loopExpression.id).toEqual(176);
        expect(loopExpression.src).toEqual("1101:3:0");
        expect(loopExpression.type).toEqual(ExpressionStatement.name);
        expect(loopExpression === statement.vLoopExpression).toEqual(true);

        expect(body.id).toEqual(187);
        expect(body.src).toEqual("1106:95:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (with condition only)`, () => {
        const statements: ForStatement[] = funcs[7].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(209);
        expect(statement.src).toEqual("1305:23:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const body = statement.children[1];

        expect(statement.vInitializationExpression === undefined).toEqual(true);

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(203);
        expect(condition.src).toEqual("1311:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(statement.vLoopExpression === undefined).toEqual(true);

        expect(body.id).toEqual(208);
        expect(body.src).toEqual("1320:8:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (with initialization only)`, () => {
        const statements: ForStatement[] = funcs[8].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(234);
        expect(statement.src).toEqual("1415:115:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(2);

        const initialization = statement.children[0];
        const body = statement.children[1];

        expect(initialization).toBeDefined();
        expect(initialization.id).toEqual(221);
        expect(initialization.src).toEqual("1420:9:0");
        expect(initialization.type).toEqual(VariableDeclarationStatement.name);
        expect(initialization === statement.vInitializationExpression).toEqual(true);

        expect(statement.vCondition === undefined).toEqual(true);
        expect(statement.vLoopExpression === undefined).toEqual(true);

        expect(body.id).toEqual(233);
        expect(body.src).toEqual("1433:97:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check FOR statement (with body only)`, () => {
        const statements: ForStatement[] = funcs[9].getChildrenByType(ForStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(259);
        expect(statement.src).toEqual("1624:106:0");
        expect(statement.type).toEqual(ForStatement.name);

        expect(statement.children.length).toEqual(1);

        const body = statement.children[0];

        expect(statement.vInitializationExpression === undefined).toEqual(true);
        expect(statement.vCondition === undefined).toEqual(true);
        expect(statement.vLoopExpression === undefined).toEqual(true);

        expect(body.id).toEqual(258);
        expect(body.src).toEqual("1633:97:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });
});
