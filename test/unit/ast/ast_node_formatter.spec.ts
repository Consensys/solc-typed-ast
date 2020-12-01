import expect from "expect";
import { ASTContext, ASTNode, ASTNodeFormatter } from "../../../src";

describe("ASTNodeFormatter", () => {
    const formatter = new ASTNodeFormatter();

    const context = new ASTContext();
    const node = new ASTNode(1, "1:2:3", "SourceUnit", undefined);

    context.register(node);

    const cases: Array<[string, [any, number], string]> = [
        ["Correctly handles undefined", [undefined, 0], "undefined"],
        ["Correctly handles null", [null, 0], "null"],
        ["Correctly handles number", [100, 0], "100"],
        ["Correctly handles string", ["test", 0], '"test"'],
        ["Correctly handles empty array", [[], 0], "Array(0)"],
        [
            "Correctly handles array with some values",
            [[1, "test", []], 0],
            'Array(3) [ 1, "test", Array(0) ]'
        ],
        ["Correctly handles plain object with no properties", [{}, 0], "Object {}"],
        ["Correctly handles empty map", [new Map(), 0], "Map(0)"],
        [
            "Correctly handles map with some values",
            [new Map([[{}, { test: 100 }]]), 0],
            "Map(1) { Object {} -> Object { test: 100 } }"
        ],
        ["Correctly handles empty set", [new Set(), 0], "Set(0)"],
        [
            "Correctly handles set with some values",
            [new Set<any>([[1, 2, 3], 1, { test: 100 }]), 0],
            "Set(3) { Array(3) [ 1, 2, 3 ], 1, Object { test: 100 } }"
        ],
        [
            "Correctly handles generic ASTNode",
            [node, 0],
            [
                "ASTNode #1 = SourceUnit",
                "    id: 1",
                '    src: "1:2:3"',
                '    type: "SourceUnit"',
                "    context: ASTContext #1",
                "    <getter> children: Array(0)",
                "    <getter> firstChild: undefined",
                "    <getter> lastChild: undefined",
                "    <getter> previousSibling: undefined",
                "    <getter> nextSibling: undefined",
                "    <getter> root: ASTNode #1 = SourceUnit",
                "    <getter> sourceInfo: Object { offset: 1, length: 2, sourceIndex: 3 }",
                ""
            ].join("\n")
        ]
    ];

    describe("format()", () => {
        for (const [title, [input, depth], output] of cases) {
            it(title, () => {
                expect(formatter.format(input, depth)).toEqual(output);
            });
        }
    });
});
