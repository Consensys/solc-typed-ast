import { Range } from "../../misc";
import { Node } from "../../misc/node";
import { TypeNode } from "./type";

export class TupleType extends TypeNode {
    public readonly elements: TypeNode[];

    constructor(elements: TypeNode[], src?: Range) {
        super(src);

        this.elements = elements;
    }

    getChildren(): Node[] {
        return this.elements;
    }

    pp(): string {
        return `tuple(${this.elements.map((element) => element.pp()).join(",")})`;
    }

    getFields(): any[] {
        return [this.elements];
    }
}
