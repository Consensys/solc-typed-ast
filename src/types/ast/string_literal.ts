import { Range } from "../../misc";
import { TypeNode } from "./type";

export class StringLiteralType extends TypeNode {
    public readonly literal: string;
    public readonly isHex: boolean;

    constructor(literal: string, isHex: boolean, src?: Range) {
        super(src);

        this.literal = literal;
        this.isHex = isHex;
    }

    pp(): string {
        return `literal_string ${this.isHex ? "hex" : ""}"${this.literal}"`;
    }

    getFields(): any[] {
        return [this.literal, this.isHex];
    }
}
