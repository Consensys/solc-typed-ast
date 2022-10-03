import { Range } from "../../misc";
import { TypeNode } from "./type";

export class ArrayType extends TypeNode {
    elementT: TypeNode;
    size?: bigint;

    constructor(elementT: TypeNode, size?: bigint, src?: Range) {
        super(src);

        this.elementT = elementT;
        this.size = size;
    }

    pp(): string {
        return `${this.elementT.pp()}[${this.size !== undefined ? this.size : ""}]`;
    }
}
