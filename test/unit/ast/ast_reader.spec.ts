import expect from "expect";
import { ASTContext, ASTNode, ASTReader } from "../../../src";
import { ModernConfiguration } from "../../../src/ast/modern/configuration";

describe("ASTContext", () => {
    it("constructor()", () => {
        const node = new ASTNode(1, "0:0:0", "ASTNode");
        const context = new ASTContext(node);

        expect(context.map.get(node.id)).toEqual(node);
        expect(Array.from(context.nodes)).toEqual([node]);
    });

    it("register()", () => {
        const node = new ASTNode(1, "0:0:0", "ASTNode");
        const context = new ASTContext();

        context.register(node);

        expect(context.map.get(node.id)).toEqual(node);
        expect(Array.from(context.nodes)).toEqual([node]);
    });

    it("unregister()", () => {
        const valid = new ASTNode(1, "0:0:0", "ASTNode");
        const invalid = new ASTNode(2, "0:0:0", "ASTNode");
        const context = new ASTContext(valid);

        context.unregister(valid);

        expect(context.map.get(valid.id)).toBeUndefined();
        expect(Array.from(context.nodes)).toEqual([]);

        expect(() => context.unregister(invalid)).toThrow();
    });

    it("locate()", () => {
        const node = new ASTNode(1, "0:0:0", "ASTNode");
        const context = new ASTContext(node);

        expect(context.locate(1)).toEqual(node);
        expect(context.locate(2)).toBeUndefined();
    });

    it("require()", () => {
        const node = new ASTNode(1, "0:0:0", "ASTNode");
        const context = new ASTContext(node);

        expect(context.require(1)).toEqual(node);
        expect(() => context.require(2)).toThrow();
    });

    it("contains()", () => {
        const valid = new ASTNode(1, "0:0:0", "ASTNode");
        const invalid = new ASTNode(2, "0:0:0", "ASTNode");
        const context = new ASTContext(valid);

        expect(context.contains(valid)).toBeTruthy();
        expect(context.contains(invalid)).toBeFalsy();
    });
});

describe("ASTReader", () => {
    describe("read()", () => {
        it("Throws an error on input without expected AST keys", () => {
            const reader = new ASTReader();

            const input = {
                sources: {
                    "empty.sol": {}
                }
            };

            expect(() => reader.read(input)).toThrow();
        });

        it("Throws an error on input without SourceUnit node", () => {
            const reader = new ASTReader();

            const input = {
                sources: {
                    "empty.sol": {
                        ast: {}
                    }
                }
            };

            expect(() => reader.read(input)).toThrow();
        });
    });

    describe("convert()", () => {
        it("Throws an error on falsy input", () => {
            const reader = new ASTReader();

            for (const arg of [undefined, null, false]) {
                expect(() => reader.convert(arg, ModernConfiguration)).toThrow();
            }
        });
    });
});
