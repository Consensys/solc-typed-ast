import { Range } from "../../misc";
import { TypeNode } from "./type";

export class IntLiteralType extends TypeNode {
    public readonly literal?: bigint;

    constructor(literal?: bigint, src?: Range) {
        super(src);

        this.literal = literal;
    }

    pp(): string {
        return `int_const${this.literal !== undefined ? ` ${this.literal.toString()}` : ""}`;
    }

    getFields(): any[] {
        return [this.literal];
    }
}
