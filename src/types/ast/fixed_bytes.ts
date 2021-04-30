import { TypeNode } from "./type";
import { Range } from "../../misc";

export class FixedBytesType extends TypeNode {
    size: number;

    constructor(size: number, src?: Range) {
        super(src);
        this.size = size;
    }

    pp(): string {
        return `bytes${this.size}`;
    }

    getFields(): any[] {
        return [this.size];
    }
}
