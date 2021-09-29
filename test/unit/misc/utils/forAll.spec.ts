import expect from "expect";
import { forAll } from "../../../../src";

const cases: Array<[string, Iterable<any>, (v: any) => boolean, boolean]> = [
    ["Set elements in range", new Set([1, 2, 3, 4]), (v) => v > 0 && v < 5, true],
    ["Set elements are even", new Set([1, 2, 3, 4]), (v) => v % 2 === 0, false],
    ["Array elements in range", [1, 2, 3, 4], (v) => v > 1 && v < 4, false],
    ["Array elements are odd", [1, 3, 5, 7], (v) => v % 2 !== 0, true]
];

describe("forAll()", () => {
    for (const [title, iterable, callback, expectation] of cases) {
        it(`${title}: ${Array.from(iterable).join(", ")}`, () => {
            expect(forAll(iterable, callback)).toEqual(expectation);
        });
    }
});
