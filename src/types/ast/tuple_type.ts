import { Range } from "../../misc";
import { Node } from "../../misc/node";
import { TypeNode } from "./type";

export class TupleType extends TypeNode {
    public readonly elements: Array<TypeNode | null>;

    constructor(elements: Array<TypeNode | null>, src?: Range) {
        super(src);

        this.elements = elements;
    }

    getChildren(): Node[] {
        return this.elements.filter((e) => e !== null) as Node[];
    }

    pp(): string {
        return `tuple(${this.elements.map((element) => (element ? element.pp() : "")).join(",")})`;
    }
}
