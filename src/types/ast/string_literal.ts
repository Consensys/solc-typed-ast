import { Range } from "../../misc";
import { TypeNode } from "./type";

export type StringLiteralKind = "string" | "unicodeString" | "hexString";

export class StringLiteralType extends TypeNode {
    public readonly kind: StringLiteralKind;

    constructor(kind: StringLiteralKind, src?: Range) {
        super(src);

        this.kind = kind;
    }

    get isHex(): boolean {
        return this.kind === "hexString";
    }

    pp(): string {
        return this.isHex ? `literal_hex_string` : `literal_string`;
    }

    getFields(): any[] {
        return [this.kind];
    }
}
