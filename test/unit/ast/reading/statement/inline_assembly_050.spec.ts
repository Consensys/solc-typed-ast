import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    FunctionDefinition,
    InlineAssembly,
    SourceUnit
} from "../../../../../src";

describe("InlineAssembly (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/inline_assembly_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all INLINE ASSEMBLY statements`, () => {
        expect(mainUnit.getChildrenByType(InlineAssembly).length).toEqual(4);
    });

    it(`Check INLINE ASSEMBLY statements in singleOneLineAssembly()`, () => {
        const statements: InlineAssembly[] = funcs[0].getChildrenByType(InlineAssembly);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(8);
        expect(statements[0].src).toEqual("124:27:0");
        expect(statements[0].type).toEqual(InlineAssembly.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
        expect(statements[0].externalReferences.length).toEqual(2);
        expect(statements[0].operations).toEqual("{ y := add(x, 1) }");
    });

    it(`Check INLINE ASSEMBLY statements in singleMultilineAssembly()`, () => {
        const statements: InlineAssembly[] = funcs[1].getChildrenByType(InlineAssembly);

        expect(statements.length).toEqual(1);

        expect(statements[0].id).toEqual(15);
        expect(statements[0].src).toEqual("220:73:0");
        expect(statements[0].type).toEqual(InlineAssembly.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
        expect(statements[0].externalReferences.length).toEqual(2);
        expect(statements[0].operations).toEqual("{\n    let y := 100\n    x := sub(y, x)\n}");
    });

    it(`Check INLINE ASSEMBLY statements in multipleAssemblies()`, () => {
        const statements: InlineAssembly[] = funcs[2].getChildrenByType(InlineAssembly);

        expect(statements.length).toEqual(2);

        expect(statements[0].id).toEqual(29);
        expect(statements[0].src).toEqual("405:86:0");
        expect(statements[0].type).toEqual(InlineAssembly.name);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[0].children.length).toEqual(0);
        expect(statements[0].externalReferences.length).toEqual(4);
        expect(statements[0].operations).toEqual("{\n    x := sub(x, 1)\n    x := add(1, x)\n}");

        expect(statements[1].id).toEqual(32);
        expect(statements[1].src).toEqual("511:100:0");
        expect(statements[1].type).toEqual(InlineAssembly.name);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);
        expect(statements[1].children.length).toEqual(0);
        expect(statements[1].externalReferences.length).toEqual(4);
        expect(statements[1].operations).toEqual(
            "{\n    let y := 200\n    a := add(x, y)\n    b := sub(x, y)\n}"
        );
    });
});
