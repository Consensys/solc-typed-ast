import expect from "expect";
import {
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    ExpressionStatement,
    FunctionDefinition,
    IfStatement,
    SourceUnit
} from "../../../../../src";

describe("IfStatement (Solc 0.4.13)", () => {
    const sample = "test/samples/solidity/statements/if_0413.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.4.13");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all IF statements`, () => {
        expect(mainUnit.getChildrenByType(IfStatement).length).toEqual(4);
    });

    it(`Check IF statement with expression`, () => {
        const statements: IfStatement[] = funcs[0].getChildrenByType(IfStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(21);
        expect(statement.src).toEqual("132:21:0");
        expect(statement.type).toEqual(IfStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const trueBody = statement.children[1];
        const falseBody = statement.children[2];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(14);
        expect(condition.src).toEqual("136:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueBody).toBeDefined();
        expect(trueBody.id).toEqual(20);
        expect(trueBody.src).toEqual("143:10:0");
        expect(trueBody.type).toEqual(ExpressionStatement.name);

        expect(statement.vTrueBody.print()).toEqual(trueBody.print());

        expect(falseBody === undefined).toEqual(true);
        expect(statement.vFalseBody === undefined).toEqual(true);
    });

    it(`Check IF-ELSE statement with expression`, () => {
        const statements: IfStatement[] = funcs[1].getChildrenByType(IfStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(49);
        expect(statement.src).toEqual("255:46:0");
        expect(statement.type).toEqual(IfStatement.name);

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0];
        const trueBody = statement.children[1];
        const falseBody = statement.children[2];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(36);
        expect(condition.src).toEqual("259:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueBody).toBeDefined();
        expect(trueBody.id).toEqual(42);
        expect(trueBody.src).toEqual("266:10:0");
        expect(trueBody.type).toEqual(ExpressionStatement.name);

        expect(statement.vTrueBody.print()).toEqual(trueBody.print());

        expect(falseBody).toBeDefined();

        expect(falseBody.id).toEqual(48);
        expect(falseBody.src).toEqual("291:10:0");
        expect(falseBody.type).toEqual(ExpressionStatement.name);

        if (statement.vFalseBody) {
            expect(statement.vFalseBody.print()).toEqual(falseBody.print());
        }
    });

    it(`Check IF statement with block`, () => {
        const statements: IfStatement[] = funcs[2].getChildrenByType(IfStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(80);
        expect(statement.src).toEqual("393:73:0");
        expect(statement.type).toEqual(IfStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const trueBody = statement.children[1];
        const falseBody = statement.children[2];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(64);
        expect(condition.src).toEqual("397:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueBody).toBeDefined();
        expect(trueBody.id).toEqual(79);
        expect(trueBody.src).toEqual("404:62:0");
        expect(trueBody.type).toEqual(Block.name);

        expect(statement.vTrueBody.print()).toEqual(trueBody.print());

        expect(falseBody === undefined).toEqual(true);

        expect(statement.vFalseBody === undefined).toEqual(true);
    });

    it(`Check IF-ELSE statement with block`, () => {
        const statements: IfStatement[] = funcs[3].getChildrenByType(IfStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(126);
        expect(statement.src).toEqual("562:141:0");
        expect(statement.type).toEqual(IfStatement.name);

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0];
        const trueBody = statement.children[1];
        const falseBody = statement.children[2];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(95);
        expect(condition.src).toEqual("566:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueBody).toBeDefined();
        expect(trueBody.id).toEqual(110);
        expect(trueBody.src).toEqual("573:62:0");
        expect(trueBody.type).toEqual(Block.name);

        expect(statement.vTrueBody.print()).toEqual(trueBody.print());

        expect(falseBody).toBeDefined();

        expect(falseBody.id).toEqual(125);
        expect(falseBody.src).toEqual("641:62:0");
        expect(falseBody.type).toEqual(Block.name);

        if (statement.vFalseBody) {
            expect(statement.vFalseBody.print()).toEqual(falseBody.print());
        }
    });
});
