import expect from "expect";
import {
    ASTReader,
    BinaryOperation,
    Block,
    compileJson,
    DoWhileStatement,
    ExpressionStatement,
    FunctionDefinition,
    SourceUnit
} from "../../../../../src";

describe("DoWhileStatement (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/do_while_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all DO-WHILE statements`, () => {
        expect(mainUnit.getChildrenByType(DoWhileStatement).length).toEqual(2);
    });

    it(`Check DO-WHILE statement with expression`, () => {
        const statements: DoWhileStatement[] = funcs[0].getChildrenByType(DoWhileStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(19);
        expect(statement.src).toEqual("142:32:0");
        expect(statement.type).toEqual(DoWhileStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const body = statement.children[1];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(18);
        expect(condition.src).toEqual("167:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.print()).toEqual(statement.vCondition.print());

        expect(body.id).toEqual(15);
        expect(body.src).toEqual("145:5:0");
        expect(body.type).toEqual(ExpressionStatement.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });

    it(`Check DO-WHILE statement with block`, () => {
        const statements: DoWhileStatement[] = funcs[1].getChildrenByType(DoWhileStatement);

        expect(statements.length).toEqual(1);

        const statement = statements[0];

        expect(statement.id).toEqual(44);
        expect(statement.src).toEqual("271:69:0");
        expect(statement.type).toEqual(DoWhileStatement.name);

        expect(statement.children.length).toEqual(2);

        const condition = statement.children[0];
        const body = statement.children[1];

        expect(condition).toBeDefined();
        expect(condition.id).toEqual(43);
        expect(condition.src).toEqual("333:5:0");
        expect(condition.type).toEqual(BinaryOperation.name);
        expect(condition.print()).toEqual(statement.vCondition.print());

        expect(body.id).toEqual(40);
        expect(body.src).toEqual("274:51:0");
        expect(body.type).toEqual(Block.name);

        expect(statement.vBody.print()).toEqual(body.print());
    });
});
