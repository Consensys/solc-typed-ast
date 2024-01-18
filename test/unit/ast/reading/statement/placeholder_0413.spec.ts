import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    IfStatement,
    ModifierDefinition,
    PlaceholderStatement,
    SourceUnit
} from "../../../../../src";

describe("PlaceholderStatement (Solc 0.4.13)", () => {
    const sample = "test/samples/solidity/statements/placeholder_0413.json";

    let mainUnit: SourceUnit;
    let mods: ModifierDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.4.13");
        const units = reader.read(data);

        mainUnit = units[0];

        mods = mainUnit.getChildrenByType(ModifierDefinition);
    });

    it(`Detect all PLACEHOLDER statements`, () => {
        expect(mainUnit.getChildrenByType(PlaceholderStatement).length).toEqual(2);
    });

    it(`Check PLACEHOLDER statements in anyway()`, () => {
        const statements: PlaceholderStatement[] = mods[0].getChildrenByType(PlaceholderStatement);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(3);
        expect(statements[0].src).toEqual("85:1:0");
        expect(statements[0].type).toEqual(PlaceholderStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
    });

    it(`Check PLACEHOLDER statements in onlyTested()`, () => {
        const statements: PlaceholderStatement[] = mods[1].getChildrenByType(PlaceholderStatement);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(18);
        expect(statements[0].src).toEqual("174:1:0");
        expect(statements[0].type).toEqual(PlaceholderStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(IfStatement.name);
        expect(statements[0].children.length).toEqual(0);
    });
});
