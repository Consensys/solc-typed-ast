import { Range } from "../../misc";
import { TypeNode } from "./type";

export type StringLiteralKind = "string" | "unicodeString" | "hexString";

export class StringLiteralType extends TypeNode {
    // TODO: Its awkward to include the expression value in the type.
    // Should remove below fields. First check if consumers use these
    public readonly literal: string;
    public readonly kind: StringLiteralKind;

    constructor(literal: string, kind: StringLiteralKind, src?: Range) {
        super(src);

        this.literal = literal;
        this.kind = kind;
    }

    get isHex(): boolean {
        return this.kind === "hexString";
    }

    pp(): string {
        return `literal_string ${this.isHex ? "hex" : ""}"${this.literal}"`;
    }

    getFields(): any[] {
        return [this.literal, this.kind];
    }
}
