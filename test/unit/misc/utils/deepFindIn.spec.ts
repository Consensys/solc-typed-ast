import expect from "expect";
import { deepFindIn } from "../../../../src";

const testObject = {
    type: "SourceUnit",
    id: 0,
    children: [
        {
            id: 2,
            type: "FunctionDefinition",
            vParameters: {
                a: 1,
                b: 3,
                c: {
                    id: 1
                }
            }
        },
        [[{ id: 5 }], { id: "6" }, { x: 2 }]
    ]
};

const cases: Array<[string, any, ((obj: any) => any) | undefined, any[], ...([boolean] | [])]> = [
    [
        "Returns deeply nested obj[matchKey] when no callback is provided",
        "id",
        undefined,
        [0, 2, 1, 5, "6"]
    ],
    [
        "Returns deeply nested obj[matchKey] when cb returns true",
        "id",
        (obj) => typeof obj.id === "number" && obj.id > 1,
        [2, 5]
    ],
    [
        "Returns cb response when it is not true or falsey",
        "0",
        (arr) => arr.length === 2 && arr[0]?.type,
        ["FunctionDefinition"]
    ],
    ["Stops at first result if match found", "id", undefined, [0], true]
];

describe("deepFindIn()", () => {
    for (const [title, key, cb, expectation, onlyFirst] of cases) {
        it(`${title}`, () => {
            expect(deepFindIn(testObject, key, cb, onlyFirst)).toMatchObject(expectation);
        });
    }
});
