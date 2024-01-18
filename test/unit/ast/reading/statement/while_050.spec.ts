import expect from "expect";
import {
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    ExpressionStatement,
    FunctionDefinition,
    SourceUnit,
    WhileStatement
} from "../../../../../src";

describe("WhileStatement (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/while_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all WHILE statements`, () => {
        expect(mainUnit.getChildrenByType(WhileStatement).length).toEqual(2);
    });

    it(`Check WHILE statement with expression`, () => {
        const statements: WhileStatement[] = funcs[0].getChildrenByType(WhileStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(19);
        expect(statement.src).toEqual("138:20:0");
        expect(statement.type).toEqual(WhileStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const body = statement.children[1];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(14);
        expect(condition.src).toEqual("145:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.print()).toEqual(statement.vCondition.print());

        expect(body.id).toEqual(18);
        expect(body.src).toEqual("152:6:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check WHILE statement with block`, () => {
        const statements: WhileStatement[] = funcs[1].getChildrenByType(WhileStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(44);
        expect(statement.src).toEqual("258:65:0");
        expect(statement.type).toEqual(WhileStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const body = statement.children[1];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(34);
        expect(condition.src).toEqual("265:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.print()).toEqual(statement.vCondition.print());

        expect(body.id).toEqual(43);
        expect(body.src).toEqual("272:51:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });
});
