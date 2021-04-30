import { TypeNode } from "./type";
import { Range } from "../../misc";

export class TupleType extends TypeNode {
    public readonly elements: TypeNode[];
    constructor(elements: TypeNode[], src?: Range) {
        super(src);
        this.elements = elements;
    }

    pp(): string {
        return `tuple(${this.elements.map((element) => element.pp()).join(",")})`;
    }

    getFields(): any[] {
        return [this.elements];
    }
}
