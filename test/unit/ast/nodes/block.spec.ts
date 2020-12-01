import expect from "expect";
import { Block, ExpressionStatement, Literal, LiteralKind } from "../../../../src";

describe("Block", () => {
    describe("removeChild()", () => {
        it("Single child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const block = new Block(3, "0:0:0", "Block", [myExprStmt1]);

            const statement = block.removeChild(myExprStmt1);

            expect(statement === myExprStmt1).toBeTruthy();

            expect(block.children.length).toEqual(0);
            expect(block.firstChild).toBeUndefined();
            expect(block.lastChild).toBeUndefined();
            expect(block.vStatements).toEqual([]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();
        });

        it("First child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const block = new Block(5, "0:0:0", "Block", [myExprStmt1, myExprStmt2]);

            const statement = block.removeChild(myExprStmt1);

            expect(statement === myExprStmt1).toBeTruthy();

            expect(block.children.length).toEqual(1);
            expect(block.firstChild === myExprStmt2).toBeTruthy();
            expect(block.lastChild === myExprStmt2).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt2]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();

            expect(myExprStmt2.previousSibling).toBeUndefined();
            expect(myExprStmt2.nextSibling).toBeUndefined();
        });

        it("Last child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const block = new Block(5, "0:0:0", "Block", [myExprStmt1, myExprStmt2]);

            const statement = block.removeChild(myExprStmt2);

            expect(statement === myExprStmt2).toBeTruthy();

            expect(block.children.length).toEqual(1);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt1).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();

            expect(myExprStmt1.previousSibling).toBeUndefined();
            expect(myExprStmt1.nextSibling).toBeUndefined();
        });

        it("Middle child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const myLiteral3 = new Literal(
                5,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "3"
            );

            const myExprStmt3 = new ExpressionStatement(
                6,
                "0:0:0",
                "ExpressionStatement",
                myLiteral3
            );

            const block = new Block(7, "0:0:0", "Block", [myExprStmt1, myExprStmt2, myExprStmt3]);

            const statement = block.removeChild(myExprStmt2);

            expect(statement === myExprStmt2).toBeTruthy();

            expect(block.children.length).toEqual(2);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt3).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1, myExprStmt3]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();

            expect(myExprStmt1.nextSibling === myExprStmt3).toBeTruthy();
            expect(myExprStmt3.previousSibling === myExprStmt1).toBeTruthy();
        });
    });

    describe("insertBefore()", () => {
        it("First child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const block = new Block(5, "0:0:0", "Block", [myExprStmt1]);

            const statement = block.insertBefore(myExprStmt2, myExprStmt1);

            expect(statement === myExprStmt2).toBeTruthy();

            expect(block.children.length).toEqual(2);
            expect(block.firstChild === myExprStmt2).toBeTruthy();
            expect(block.lastChild === myExprStmt1).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt2, myExprStmt1]);

            expect(statement.parent === block).toBeTruthy();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling === myExprStmt1).toBeTruthy();

            expect(myExprStmt1.previousSibling === statement).toBeTruthy();
        });

        it("Last child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const myLiteral3 = new Literal(
                5,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "3"
            );

            const myExprStmt3 = new ExpressionStatement(
                6,
                "0:0:0",
                "ExpressionStatement",
                myLiteral3
            );

            const block = new Block(7, "0:0:0", "Block", [myExprStmt1, myExprStmt2]);

            const statement = block.insertBefore(myExprStmt3, myExprStmt2);

            expect(statement === myExprStmt3).toBeTruthy();

            expect(block.children.length).toEqual(3);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt2).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1, myExprStmt3, myExprStmt2]);

            expect(statement.parent === block).toBeTruthy();
            expect(statement.previousSibling === myExprStmt1).toBeTruthy();
            expect(statement.nextSibling === myExprStmt2).toBeTruthy();

            expect(myExprStmt1.nextSibling === myExprStmt3).toBeTruthy();
            expect(myExprStmt2.previousSibling === myExprStmt3).toBeTruthy();
        });
    });

    describe("insertAfter()", () => {
        it("Last child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const block = new Block(5, "0:0:0", "Block", [myExprStmt1]);

            const statement = block.insertAfter(myExprStmt2, myExprStmt1);

            expect(statement === myExprStmt2).toBeTruthy();

            expect(block.children.length).toEqual(2);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt2).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1, myExprStmt2]);

            expect(statement.parent === block).toBeTruthy();
            expect(statement.nextSibling).toBeUndefined();
            expect(statement.previousSibling === myExprStmt1).toBeTruthy();

            expect(myExprStmt1.nextSibling === statement).toBeTruthy();
        });

        it("First child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const myLiteral3 = new Literal(
                5,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "3"
            );

            const myExprStmt3 = new ExpressionStatement(
                6,
                "0:0:0",
                "ExpressionStatement",
                myLiteral3
            );

            const block = new Block(7, "0:0:0", "Block", [myExprStmt1, myExprStmt2]);

            const statement = block.insertAfter(myExprStmt3, myExprStmt1);

            expect(statement === myExprStmt3).toBeTruthy();

            expect(block.children.length).toEqual(3);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt2).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1, myExprStmt3, myExprStmt2]);

            expect(statement.parent === block).toBeTruthy();
            expect(statement.previousSibling === myExprStmt1).toBeTruthy();
            expect(statement.nextSibling === myExprStmt2).toBeTruthy();
        });
    });

    describe("replaceChild()", () => {
        it("Single child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const block = new Block(5, "0:0:0", "Block", [myExprStmt1]);

            const statement = block.replaceChild(myExprStmt2, myExprStmt1);

            expect(statement === myExprStmt1).toBeTruthy();

            expect(block.children.length).toEqual(1);
            expect(block.firstChild === myExprStmt2).toBeTruthy();
            expect(block.lastChild === myExprStmt2).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt2]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();
        });

        it("Middle child", () => {
            const myLiteral1 = new Literal(
                1,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "1"
            );

            const myExprStmt1 = new ExpressionStatement(
                2,
                "0:0:0",
                "ExpressionStatement",
                myLiteral1
            );

            const myLiteral2 = new Literal(
                3,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "2"
            );

            const myExprStmt2 = new ExpressionStatement(
                4,
                "0:0:0",
                "ExpressionStatement",
                myLiteral2
            );

            const myLiteral3 = new Literal(
                5,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "3"
            );

            const myExprStmt3 = new ExpressionStatement(
                6,
                "0:0:0",
                "ExpressionStatement",
                myLiteral3
            );

            const myLiteral4 = new Literal(
                7,
                "0:0:0",
                "Literal",
                "uint256",
                LiteralKind.Number,
                "",
                "4"
            );

            const myExprStmt4 = new ExpressionStatement(
                8,
                "0:0:0",
                "ExpressionStatement",
                myLiteral4
            );

            const block = new Block(9, "0:0:0", "Block", [myExprStmt1, myExprStmt2, myExprStmt3]);

            const statement = block.replaceChild(myExprStmt4, myExprStmt2);

            expect(statement === myExprStmt2).toBeTruthy();

            expect(block.children.length).toEqual(3);
            expect(block.firstChild === myExprStmt1).toBeTruthy();
            expect(block.lastChild === myExprStmt3).toBeTruthy();
            expect(block.vStatements).toEqual([myExprStmt1, myExprStmt4, myExprStmt3]);

            expect(statement.parent).toBeUndefined();
            expect(statement.previousSibling).toBeUndefined();
            expect(statement.nextSibling).toBeUndefined();

            expect(myExprStmt1.nextSibling === myExprStmt4).toBeTruthy();
            expect(myExprStmt4.previousSibling === myExprStmt1).toBeTruthy();

            expect(myExprStmt3.previousSibling === myExprStmt4).toBeTruthy();
            expect(myExprStmt4.nextSibling === myExprStmt3).toBeTruthy();
        });
    });
});
