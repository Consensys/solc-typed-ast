import expect from "expect";
import {
    ASTNode,
    ASTReader,
    Block,
    compileJson,
    ForStatement,
    FunctionDefinition,
    Literal,
    SourceUnit,
    TupleExpression,
    VariableDeclaration,
    VariableDeclarationStatement
} from "../../../../../src";

describe("VariableDeclarationStatement (Solc 0.5.0)", () => {
    const sample = "test/samples/solidity/statements/variable_declaration_050.json";

    let mainUnit: SourceUnit;
    let funcs: FunctionDefinition[];

    beforeAll(async () => {
        const reader = new ASTReader();
        const { data } = await compileJson(sample, "0.5.0");
        const units = reader.read(data);

        mainUnit = units[0];

        funcs = mainUnit.getChildrenByType(FunctionDefinition);
    });

    it(`Detect all VARIABLE DECLARATION statements`, () => {
        expect(mainUnit.getChildrenByType(VariableDeclarationStatement).length).toEqual(7);
    });

    it(`Check VARIABLE DECLARATION statements in single()`, () => {
        const statements: VariableDeclarationStatement[] = funcs[0].getChildrenByType(
            VariableDeclarationStatement
        );

        expect(statements.length).toEqual(1);

        /**
         * c
         */
        expect(statements[0].id).toEqual(14);
        expect(statements[0].src).toEqual("140:9:0");
        expect(statements[0].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[0].assignments).toEqual([12]);

        expect((statements[0].parent as ASTNode).id).toEqual(15);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[0].children.length).toEqual(2);
        expect(statements[0].vDeclarations.length).toEqual(1);

        expect(statements[0].children[0] === statements[0].vDeclarations[0]).toEqual(true);
        expect(statements[0].children[0].id).toEqual(12);
        expect(statements[0].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[0].children[1] === statements[0].vInitialValue).toEqual(true);
        expect(statements[0].children[1].id).toEqual(13);
        expect(statements[0].children[1].type).toEqual(Literal.name);
    });

    it(`Check VARIABLE DECLARATION statements in multiple()`, () => {
        const statements: VariableDeclarationStatement[] = funcs[1].getChildrenByType(
            VariableDeclarationStatement
        );

        expect(statements.length).toEqual(2);

        /**
         * x
         */
        expect(statements[0].id).toEqual(21);
        expect(statements[0].src).toEqual("199:5:0");
        expect(statements[0].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[0].assignments).toEqual([20]);

        expect((statements[0].parent as ASTNode).id).toEqual(35);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[0].children.length).toEqual(1);
        expect(statements[0].vDeclarations.length).toEqual(1);

        expect(statements[0].children[0] === statements[0].vDeclarations[0]).toEqual(true);
        expect(statements[0].children[0].id).toEqual(20);
        expect(statements[0].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[0].vInitialValue === undefined).toEqual(true);

        /**
         * y, z
         */
        expect(statements[1].id).toEqual(30);
        expect(statements[1].src).toEqual("215:29:0");
        expect(statements[1].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[1].assignments).toEqual([23, null, 25]);

        expect((statements[1].parent as ASTNode).id).toEqual(35);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[1].children.length).toEqual(3);
        expect(statements[1].vDeclarations.length).toEqual(2);

        expect(statements[1].children[0] === statements[1].vDeclarations[0]).toEqual(true);
        expect(statements[1].children[0].id).toEqual(23);
        expect(statements[1].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[1].children[1] === statements[1].vDeclarations[1]).toEqual(true);
        expect(statements[1].children[1].id).toEqual(25);
        expect(statements[1].children[1].type).toEqual(VariableDeclaration.name);

        expect(statements[1].children[2] === statements[1].vInitialValue).toEqual(true);
        expect(statements[1].children[2].id).toEqual(29);
        expect(statements[1].children[2].type).toEqual(TupleExpression.name);
    });

    it(`Check VARIABLE DECLARATION statements in nested()`, () => {
        const statements: VariableDeclarationStatement[] = funcs[2].getChildrenByType(
            VariableDeclarationStatement
        );

        expect(statements.length).toEqual(4);

        /**
         * j
         */
        expect(statements[0].id).toEqual(42);
        expect(statements[0].src).toEqual("322:9:0");
        expect(statements[0].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[0].assignments).toEqual([40]);

        expect((statements[0].parent as ASTNode).id).toEqual(43);
        expect((statements[0].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[0].children.length).toEqual(2);
        expect(statements[0].vDeclarations.length).toEqual(1);

        expect(statements[0].children[0] === statements[0].vDeclarations[0]).toEqual(true);
        expect(statements[0].children[0].id).toEqual(40);
        expect(statements[0].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[0].children[1] === statements[0].vInitialValue).toEqual(true);
        expect(statements[0].children[1].id).toEqual(41);
        expect(statements[0].children[1].type).toEqual(Literal.name);

        /**
         * test
         */
        expect(statements[1].id).toEqual(48);
        expect(statements[1].src).toEqual("376:27:0");
        expect(statements[1].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[1].assignments).toEqual([46]);

        expect((statements[1].parent as ASTNode).id).toEqual(49);
        expect((statements[1].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[1].children.length).toEqual(2);
        expect(statements[1].vDeclarations.length).toEqual(1);

        expect(statements[1].children[0] === statements[1].vDeclarations[0]).toEqual(true);
        expect(statements[1].children[0].id).toEqual(46);
        expect(statements[1].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[1].children[1] === statements[1].vInitialValue).toEqual(true);
        expect(statements[1].children[1].id).toEqual(47);
        expect(statements[1].children[1].type).toEqual(Literal.name);

        /**
         * i
         */
        expect(statements[2].id).toEqual(54);
        expect(statements[2].src).toEqual("429:9:0");
        expect(statements[2].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[2].assignments).toEqual([52]);

        expect((statements[2].parent as ASTNode).id).toEqual(66);
        expect((statements[2].parent as ASTNode).type).toEqual(ForStatement.name);

        expect(statements[2].children.length).toEqual(2);
        expect(statements[2].vDeclarations.length).toEqual(1);

        expect(statements[2].children[0] === statements[2].vDeclarations[0]).toEqual(true);
        expect(statements[2].children[0].id).toEqual(52);
        expect(statements[2].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[2].children[1] === statements[2].vInitialValue).toEqual(true);
        expect(statements[2].children[1].id).toEqual(53);
        expect(statements[2].children[1].type).toEqual(Literal.name);

        /**
         * a
         */
        expect(statements[3].id).toEqual(64);
        expect(statements[3].src).toEqual("466:20:0");
        expect(statements[3].type).toEqual(VariableDeclarationStatement.name);
        expect(statements[3].assignments).toEqual([62]);

        expect((statements[3].parent as ASTNode).id).toEqual(65);
        expect((statements[3].parent as ASTNode).type).toEqual(Block.name);

        expect(statements[3].children.length).toEqual(2);
        expect(statements[3].vDeclarations.length).toEqual(1);

        expect(statements[3].children[0] === statements[3].vDeclarations[0]).toEqual(true);
        expect(statements[3].children[0].id).toEqual(62);
        expect(statements[3].children[0].type).toEqual(VariableDeclaration.name);

        expect(statements[3].children[1] === statements[3].vInitialValue).toEqual(true);
        expect(statements[3].children[1].id).toEqual(63);
        expect(statements[3].children[1].type).toEqual(Literal.name);
    });
});
