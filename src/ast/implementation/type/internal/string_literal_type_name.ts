import { InternalTypeName } from "./internal_type_name";

export class StringLiteralTypeName extends InternalTypeName {
    public readonly literal: string;
    public readonly isHex: boolean;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        literal: string,
        isHex: boolean
    ) {
        super(id, src, type, typeString);
        this.literal = literal;
        this.isHex = isHex;
    }
}
