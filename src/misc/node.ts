import { StructEqualityComparable } from "./struct_equality";
import { assert } from "./utils";

export type Position = { offset: number; line: number; column: number };
export type Range = { start: Position; end: Position };

let nNodes = 0;

/**
 * Generic tree node with pretty-printer, optional source tripple information
 * and structural equality comparison. Useful for building ASTs.
 */
export abstract class Node implements StructEqualityComparable {
    readonly id: number;
    readonly src?: Range;

    constructor(src?: Range) {
        this.id = nNodes++;
        this.src = src;
    }

    abstract pp(): string;
    abstract getFields(): any[];

    getChildren(): Node[] {
        return this.getFields().filter((field) => field instanceof Node);
    }

    walk(cb: (node: Node) => void): void {
        cb(this);

        for (const child of this.getChildren()) {
            child.walk(cb);
        }
    }

    get requiredSrc(): Range {
        assert(this.src !== undefined, `Missing source information for node ${this.pp()}`);

        return this.src;
    }

    getSourceFragment(src: string): string {
        const rng = this.requiredSrc;

        return src.slice(rng.start.offset, rng.end.offset);
    }
}
