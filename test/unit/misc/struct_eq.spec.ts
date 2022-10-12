import expect from "expect";
import { eq, StructEqualityComparable } from "../../../src";

class A implements StructEqualityComparable {
    constructor(public readonly els: any[]) {}
    getFields(): any[] {
        return this.els;
    }
}

class B implements StructEqualityComparable {
    constructor(public readonly els: any[]) {}
    getFields(): any[] {
        return this.els;
    }
}

const samples: Array<[any, any, boolean]> = [
    [1, 1, true],
    [1, 2, false],
    [1, 1n, false],
    [1, "1", false],
    [undefined, null, false],
    [null, null, true],
    [undefined, undefined, true],
    [1n, 1n, true],
    [1n, 2n, false],
    [[1, 2], [1, 2, 3], false],
    [[1, 2], [2, 2], false],
    [[1, 2], [1, 2], true],
    [{ a: 1 }, { b: 1, c: 1 }, false],
    [{ a: 1, b: 1 }, { a: 1 }, false],
    [{ a: 1, b: 1 }, { a: 1, b: 2 }, false],
    [{ a: 1, b: 2 }, { a: 1, b: 2 }, true],
    [new Set([1, 2, 3]), new Set([1, 2]), false],
    [new Set([1, 2, 3]), new Set([1, 2, 4]), false],
    [new Set([1, 2, 3]), new Set([1, 2, 3]), true],
    [new A([1, 2, 3]), new B([1, 2, 3]), false],
    [new A([1, 2, 3]), new A([1, 2, 3, 4]), false],
    [new A([1, 2, 3]), new A([1, 2, 4]), false],
    [new A([1, 2, 3]), new A([1, 2, 3]), true]
];

describe("Structural equality unit tests", () => {
    for (const [a, b, expectedEq] of samples) {
        it(`eq(${a},${b}) is ${expectedEq}`, () => {
            expect(eq(a, b)).toEqual(expectedEq);
        });
    }
});
