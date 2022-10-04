import { Range } from "../../misc";
import { TypeNode } from "./type";

export class FixedBytesType extends TypeNode {
    size: number;

    constructor(size: number, src?: Range) {
        super(src);

        this.size = size;
    }

    pp(): string {
        return `bytes${this.size}`;
    }
}
