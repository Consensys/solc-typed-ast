import expect from "expect";
import {
    assert,
    ASTContext,
    ASTNode,
    ElementaryTypeName,
    IntType,
    TypeNode
} from "../../../../src";

const typeNode = new IntType(256, false);
const astNode = new ElementaryTypeName(1, "0:0:0", "ElementaryTypeName", "uint8", "uint8");
const ctx = new ASTContext();

ctx.register(astNode);

const cases: Array<[boolean, string, Array<string | ASTNode | TypeNode>, string | undefined]> = [
    [true, "Test none", [], undefined],
    [false, "Test string {0}, {1}, {2}", ["x", "y", "z"], "Test string x, y, z"],
    [false, "Test {0} AST node", [astNode], "Test ElementaryTypeName #1 AST node"],
    [false, "Test {0} type node", [typeNode], "Test uint256 type node"],
    [
        false,
        "Test {0} combined {1} parts {2}",
        [astNode, typeNode, "xyz"],
        "Test ElementaryTypeName #1 combined uint256 parts xyz"
    ],
    [
        false,
        "Test not mentioned AST node",
        [astNode],
        "Test not mentioned AST node.\n\nElementaryTypeName #1"
    ]
];

describe("assert()", () => {
    for (const [condition, message, parts, snapshot] of cases) {
        if (snapshot) {
            it(`${condition}, "${message}" throws expected error`, () => {
                expect(() => assert(condition, message, ...parts)).toThrow(snapshot);
            });
        } else {
            it(`${condition}, "${message}" passes`, () => {
                expect(() => assert(condition, message, ...parts)).not.toThrow();
            });
        }
    }
});
