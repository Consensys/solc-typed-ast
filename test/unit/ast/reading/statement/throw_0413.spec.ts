import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    FunctionDefinition,
    IfStatement,
    SourceUnit,
    Throw
} from "../../../../../src";

describe("Throw (Solc 0.4.13)", () => {
    const sample = "test/samples/solidity/statements/throw_0413.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.4.13");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all THROW statements`, () => {
        expect(mainUnit.getChildrenByType(Throw).length).toEqual(2);
    });

    it(`Check THROW statements in singleThrow()`, () => {
        const statements: Throw[] = funcs[0].getChildrenByType(Throw);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(6);
        expect(statements[0].src).toEqual("107:5:0");
        expect(statements[0].type).toEqual(Throw.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
    });

    it(`Check THROW statements in nestedThrow()`, () => {
        const statements: Throw[] = funcs[1].getChildrenByType(Throw);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(18);
        expect(statements[0].src).toEqual("197:5:0");
        expect(statements[0].type).toEqual(Throw.name);
        expect((statements[0].parent as ASTNode).type).toEqual(IfStatement.name);
        expect(statements[0].children.length).toEqual(0);
    });
});
