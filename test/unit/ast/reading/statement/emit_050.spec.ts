import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    EmitStatement,
    FunctionCall,
    FunctionDefinition,
    SourceUnit
} from "../../../../../src";

describe("EmitStatement (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/emit_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all EMIT statements`, () => {
        expect(mainUnit.getChildrenByType(EmitStatement).length).toEqual(3);
    });

    it(`Check EMIT statements in singleEmit()`, () => {
        const statements: EmitStatement[] = funcs[0].getChildrenByType(EmitStatement);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(25);
        expect(statements[0].src).toEqual("215:34:0");
        expect(statements[0].type).toEqual(EmitStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].type).toEqual(FunctionCall.name);
        expect(statements[0].children[0] === statements[0].vEventCall).toEqual(true);

        const call = statements[0].vEventCall;

        expect(call.id).toEqual(24);
        expect(call.vIdentifier).toEqual("A");
        expect(call.vArguments.length).toEqual(3);
    });

    it(`Check EMIT statements in multipleEmits()`, () => {
        const statements: EmitStatement[] = funcs[1].getChildrenByType(EmitStatement);

        let call: FunctionCall;

        expect(statements.length).toEqual(2);

        expect(statements[0].id).toEqual(41);
        expect(statements[0].src).toEqual("335:28:0");
        expect(statements[0].type).toEqual(EmitStatement.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].children[0].type).toEqual(FunctionCall.name);
        expect(statements[0].children[0] === statements[0].vEventCall).toEqual(true);

        call = statements[0].vEventCall;

        expect(call.id).toEqual(40);
        expect(call.vIdentifier).toEqual("B");
        expect(call.vArguments.length).toEqual(2);

        expect(statements[1].id).toEqual(51);
        expect(statements[1].src).toEqual("384:34:0");
        expect(statements[1].type).toEqual(EmitStatement.name);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[1].children.length).toEqual(1);
        expect(statements[1].children[0].type).toEqual(FunctionCall.name);
        expect(statements[1].children[0] === statements[1].vEventCall).toEqual(true);

        call = statements[1].vEventCall;

        expect(call.id).toEqual(50);
        expect(call.vIdentifier).toEqual("A");
        expect(call.vArguments.length).toEqual(3);
    });
});
