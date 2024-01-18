import expect from "expect";
import { eq, Node, Range } from "../../../src";

class TestNode extends Node {
    public readonly n: number;
    public readonly s: string;
    public readonly m: { [key: string]: number };
    public left?: TestNode;
    public right?: TestNode;

    constructor(n: number, s: string, left?: TestNode, right?: TestNode, src?: Range) {
        super(src);
        this.n = n;
        this.s = s;
        this.m = {
            s: n
        };
        this.left = left;
        this.right = right;
    }

    pp(): string {
        return `<${this.n}, ${this.s}, ${this.left != undefined ? this.left.pp() : ""}, ${
            this.right != undefined ? this.right.pp() : ""
        }>`;
    }

    getFields(): any[] {
        return [this.n, this.s, this.m, this.left, this.right];
    }
}

describe("Node unit tests", () => {
    let a: TestNode;
    let b: TestNode;
    let c: TestNode;
    let d: TestNode;
    let d1: TestNode;
    let d2: TestNode;
    let srcd: TestNode;
    let e: TestNode;
    const src: Range = {
        start: { offset: 1, line: -1, column: -1 },
        end: { offset: 3, line: -1, column: -1 }
    };

    beforeAll(() => {
        a = new TestNode(1, "a");
        b = new TestNode(1, "a");
        c = new TestNode(2, "a");
        d = new TestNode(3, "e", a, b);
        d1 = new TestNode(3, "e", a, b);
        d2 = new TestNode(3, "e", a, c);
        srcd = new TestNode(0, "z", undefined, undefined, src);
        e = new TestNode(4, "f", d2, d1);
    });

    it("Check equality", () => {
        expect(eq(a, a)).toBeTruthy();
        expect(eq(a, b)).toBeTruthy();
        expect(eq(a, c)).not.toBeTruthy();

        expect(eq(d, d1)).toBeTruthy();
        expect(eq(d, d2)).not.toBeTruthy();
    });

    it("getChildren()", () => {
        expect(a.getChildren()).toEqual([]);
        expect(d.getChildren()).toEqual([a, b]);
        expect(d2.getChildren()).toEqual([a, c]);
        expect(e.getChildren()).toEqual([d2, d1]);
    });

    it("walkChildren()", () => {
        const samples: Array<[TestNode, TestNode[]]> = [
            [d1, [d1, a, b]],
            [e, [e, d2, a, c, d1, a, b]]
        ];
        for (const [nd, expChildren] of samples) {
            const children: Node[] = [];
            nd.walk((child) => {
                children.push(child);
            });

            // Walking includes the node itself.
            expect(children).toEqual(expChildren);
        }
    });

    it("requiredSrc and getSourceFragment()", () => {
        expect(srcd.requiredSrc).toEqual(src);

        expect(srcd.getSourceFragment("abcde")).toEqual("bc");
    });
});
