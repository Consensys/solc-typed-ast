import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    DoWhileStatement,
    ForStatement,
    FunctionDefinition,
    IfStatement,
    SourceUnit,
    WhileStatement
} from "../../../../../src";

describe("Block (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/block_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all BLOCK statements`, () => {
        expect(mainUnit.getChildrenByType(Block).length).toEqual(11);
    });

    it(`Check BLOCK statements in nestedBlocks()`, () => {
        const blocks: Block[] = funcs[0].getChildrenByType(Block);

        expect(blocks.length).toEqual(4);

        expect(blocks[0].id).toEqual(19);
        expect(blocks[0].src).toEqual("81:174:0");
        expect(blocks[0].type).toEqual(Block.name);
        expect((blocks[0].parent as ASTNode).type).toEqual(FunctionDefinition.name);
        expect(blocks[0].children.length).toEqual(1);

        expect(blocks[1].id).toEqual(18);
        expect(blocks[1].src).toEqual("91:158:0");
        expect(blocks[1].type).toEqual(Block.name);
        expect((blocks[1].parent as ASTNode).type).toEqual(Block.name);
        expect(blocks[1].children.length).toEqual(2);

        expect(blocks[2].id).toEqual(17);
        expect(blocks[2].src).toEqual("129:110:0");
        expect(blocks[2].type).toEqual(Block.name);
        expect((blocks[2].parent as ASTNode).type).toEqual(Block.name);
        expect(blocks[2].children.length).toEqual(2);

        expect(blocks[3].id).toEqual(16);
        expect(blocks[3].src).toEqual("175:50:0");
        expect(blocks[3].type).toEqual(Block.name);
        expect((blocks[3].parent as ASTNode).type).toEqual(Block.name);
        expect(blocks[3].children.length).toEqual(1);
    });

    it(`Check BLOCK statements in statementBlocks()`, () => {
        const blocks: Block[] = funcs[1].getChildrenByType(Block);

        expect(blocks.length).toEqual(6);

        expect(blocks[0].id).toEqual(93);
        expect(blocks[0].src).toEqual("295:415:0");
        expect(blocks[0].type).toEqual(Block.name);
        expect((blocks[0].parent as ASTNode).type).toEqual(FunctionDefinition.name);
        expect(blocks[0].children.length).toEqual(6);

        expect(blocks[1].id).toEqual(30);
        expect(blocks[1].src).toEqual("315:45:0");
        expect(blocks[1].type).toEqual(Block.name);
        expect((blocks[1].parent as ASTNode).type).toEqual(IfStatement.name);
        expect(blocks[1].children.length).toEqual(1);

        expect(blocks[2].id).toEqual(37);
        expect(blocks[2].src).toEqual("366:46:0");
        expect(blocks[2].type).toEqual(Block.name);
        expect((blocks[2].parent as ASTNode).type).toEqual(IfStatement.name);
        expect(blocks[2].children.length).toEqual(1);

        expect(blocks[3].id).toEqual(55);
        expect(blocks[3].src).toEqual("451:41:0");
        expect(blocks[3].type).toEqual(Block.name);
        expect((blocks[3].parent as ASTNode).type).toEqual(ForStatement.name);
        expect(blocks[3].children.length).toEqual(1);

        expect(blocks[4].id).toEqual(73);
        expect(blocks[4].src).toEqual("537:59:0");
        expect(blocks[4].type).toEqual(Block.name);
        expect((blocks[4].parent as ASTNode).type).toEqual(WhileStatement.name);
        expect(blocks[4].children.length).toEqual(2);

        expect(blocks[5].id).toEqual(88);
        expect(blocks[5].src).toEqual("629:59:0");
        expect(blocks[5].type).toEqual(Block.name);
        expect((blocks[5].parent as ASTNode).type).toEqual(DoWhileStatement.name);
        expect(blocks[5].children.length).toEqual(2);
    });

    it(`Check BLOCK statements in testNoBlocks()`, () => {
        const blocks: Block[] = funcs[2].getChildrenByType(Block);

        expect(blocks.length).toEqual(1);

        expect(blocks[0].id).toEqual(158);
        expect(blocks[0].src).toEqual("747:279:0");
        expect(blocks[0].type).toEqual(Block.name);
        expect((blocks[0].parent as ASTNode).type).toEqual(FunctionDefinition.name);
        expect(blocks[0].children.length).toEqual(6);
    });
});
