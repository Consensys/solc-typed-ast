import expect from "expect";
import {
    ASTReader,
    BinaryOperation,
    compileJson,
    Conditional,
    FunctionDefinition,
    Identifier,
    Literal,
    SourceUnit,
    TupleExpression
} from "../../../../../src";

describe("Conditional (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/expressions/conditional_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all conditional expressions`, () => {
        expect(mainUnit.getChildrenByType(Conditional).length).toEqual(6);
    });

    it(`Check conditional statement (simple)`, () => {
        const statements: Conditional[] = funcs[0].getChildrenByType(Conditional);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(13);
        expect(statement.src).toEqual("130:16:0");
        expect(statement.type).toEqual(Conditional.name);
        expect(statement.typeString).toEqual("uint8");

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0] as BinaryOperation;
        const trueExpression = statement.children[1] as Literal;
        const falseExpression = statement.children[2] as Literal;

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(10);
        expect(condition.src).toEqual("130:6:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.typeString).toEqual("bool");
        expect(condition.operator).toEqual(">");
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueExpression).toBeDefined();
        expect(trueExpression.id).toEqual(11);
        expect(trueExpression.src).toEqual("139:2:0");
        expect(trueExpression.type).toEqual(Literal.name);
        expect(trueExpression.value).toEqual("10");
        expect(trueExpression === statement.vTrueExpression).toEqual(true);

        expect(falseExpression).toBeDefined();
        expect(falseExpression.id).toEqual(12);
        expect(falseExpression.src).toEqual("144:2:0");
        expect(falseExpression.type).toEqual(Literal.name);
        expect(falseExpression.value).toEqual("15");
        expect(falseExpression === statement.vFalseExpression).toEqual(true);
    });

    it(`Check conditional statement (nested)`, () => {
        const statements: Conditional[] = funcs[1].getChildrenByType(Conditional);

        expect(statements.length).toEqual(4);

        const statement = statements[0];

        expect(statement.id).toEqual(42);
        expect(statement.src).toEqual("237:81:0");
        expect(statement.type).toEqual(Conditional.name);
        expect(statement.typeString).toEqual("uint256");

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0] as TupleExpression;
        const conditionExpression = condition.firstChild as Conditional;
        const trueExpression = statement.children[1] as Conditional;
        const falseExpression = statement.children[2] as Conditional;

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(29);
        expect(condition.src).toEqual("237:23:0");
        expect(condition.type).toEqual(TupleExpression.name);
        expect(condition.typeString).toEqual("bool");
        expect(condition === statement.vCondition).toEqual(true);

        expect(conditionExpression).toBeDefined();
        expect(conditionExpression.id).toEqual(28);
        expect(conditionExpression.src).toEqual("238:21:0");
        expect(conditionExpression.type).toEqual(Conditional.name);
        expect(conditionExpression.typeString).toEqual("bool");
        expect(conditionExpression.children.length).toEqual(3);

        expect(conditionExpression.vCondition).toBeDefined();
        expect(conditionExpression.vCondition.id).toEqual(25);
        expect(conditionExpression.vCondition.src).toEqual("238:6:0");
        expect(conditionExpression.vCondition.type).toEqual(BinaryOperation.name);
        expect(conditionExpression.vCondition.children.length).toEqual(2);
        expect((conditionExpression.vCondition as BinaryOperation).operator).toEqual(">");

        expect(conditionExpression.vTrueExpression).toBeDefined();
        expect(conditionExpression.vTrueExpression.id).toEqual(26);
        expect(conditionExpression.vTrueExpression.src).toEqual("247:4:0");
        expect(conditionExpression.vTrueExpression.type).toEqual(Literal.name);
        expect((conditionExpression.vTrueExpression as Literal).value).toEqual("true");

        expect(conditionExpression.vFalseExpression).toBeDefined();
        expect(conditionExpression.vFalseExpression.id).toEqual(27);
        expect(conditionExpression.vFalseExpression.src).toEqual("254:5:0");
        expect(conditionExpression.vFalseExpression.type).toEqual(Literal.name);
        expect((conditionExpression.vFalseExpression as Literal).value).toEqual("false");

        expect(trueExpression).toBeDefined();
        expect(trueExpression.id).toEqual(35);
        expect(trueExpression.src).toEqual("275:15:0");
        expect(trueExpression.type).toEqual(Conditional.name);
        expect(trueExpression.typeString).toEqual("uint256");
        expect(trueExpression === statement.vTrueExpression).toEqual(true);

        expect(trueExpression.vCondition).toBeDefined();
        expect(trueExpression.vCondition.id).toEqual(32);
        expect(trueExpression.vCondition.src).toEqual("275:6:0");
        expect(trueExpression.vCondition.type).toEqual(BinaryOperation.name);
        expect(trueExpression.vCondition.children.length).toEqual(2);
        expect((trueExpression.vCondition as BinaryOperation).operator).toEqual(">");

        expect(trueExpression.vTrueExpression).toBeDefined();
        expect(trueExpression.vTrueExpression.id).toEqual(33);
        expect(trueExpression.vTrueExpression.src).toEqual("284:2:0");
        expect(trueExpression.vTrueExpression.type).toEqual(Literal.name);
        expect((trueExpression.vTrueExpression as Literal).value).toEqual("20");

        expect(trueExpression.vFalseExpression).toBeDefined();
        expect(trueExpression.vFalseExpression.id).toEqual(34);
        expect(trueExpression.vFalseExpression.src).toEqual("289:1:0");
        expect(trueExpression.vFalseExpression.type).toEqual(Identifier.name);
        expect((trueExpression.vFalseExpression as Identifier).name).toEqual("a");

        expect(falseExpression).toBeDefined();
        expect(falseExpression.id).toEqual(41);
        expect(falseExpression.src).toEqual("305:13:0");
        expect(falseExpression.type).toEqual(Conditional.name);
        expect(falseExpression.typeString).toEqual("uint256");
        expect(falseExpression === statement.vFalseExpression).toEqual(true);

        expect(falseExpression.vCondition).toBeDefined();
        expect(falseExpression.vCondition.id).toEqual(38);
        expect(falseExpression.vCondition.src).toEqual("305:5:0");
        expect(falseExpression.vCondition.type).toEqual(BinaryOperation.name);
        expect(falseExpression.vCondition.children.length).toEqual(2);
        expect((falseExpression.vCondition as BinaryOperation).operator).toEqual("<");

        expect(falseExpression.vTrueExpression).toBeDefined();
        expect(falseExpression.vTrueExpression.id).toEqual(39);
        expect(falseExpression.vTrueExpression.src).toEqual("313:1:0");
        expect(falseExpression.vTrueExpression.type).toEqual(Identifier.name);
        expect((falseExpression.vTrueExpression as Identifier).name).toEqual("a");

        expect(falseExpression.vFalseExpression).toBeDefined();
        expect(falseExpression.vFalseExpression.id).toEqual(40);
        expect(falseExpression.vFalseExpression.src).toEqual("317:1:0");
        expect(falseExpression.vFalseExpression.type).toEqual(Literal.name);
        expect((falseExpression.vFalseExpression as Literal).value).toEqual("0");
    });

    it(`Check conditional statement (with complex expressions)`, () => {
        const statements: Conditional[] = funcs[2].getChildrenByType(Conditional);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(68);
        expect(statement.src).toEqual("421:42:0");
        expect(statement.type).toEqual(Conditional.name);
        expect(statement.typeString).toEqual("uint256");

        expect(statement.children.length).toEqual(3);

        const condition = statement.children[0] as BinaryOperation;
        const trueExpression = statement.children[1] as BinaryOperation;
        const falseExpression = statement.children[2] as BinaryOperation;

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(56);
        expect(condition.src).toEqual("421:10:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.typeString).toEqual("bool");
        expect(condition.operator).toEqual("==");
        expect(condition === statement.vCondition).toEqual(true);

        expect(trueExpression).toBeDefined();
        expect(trueExpression.id).toEqual(62);
        expect(trueExpression.src).toEqual("434:17:0");
        expect(trueExpression.type).toEqual(BinaryOperation.name);
        expect(trueExpression.typeString).toEqual("uint256");
        expect(trueExpression.operator).toEqual("+");
        expect(trueExpression === statement.vTrueExpression).toEqual(true);

        expect(falseExpression).toBeDefined();
        expect(falseExpression.id).toEqual(67);
        expect(falseExpression.src).toEqual("454:9:0");
        expect(falseExpression.type).toEqual(BinaryOperation.name);
        expect(falseExpression.typeString).toEqual("uint256");
        expect(falseExpression.operator).toEqual("/");
        expect(falseExpression === statement.vFalseExpression).toEqual(true);
    });
});
