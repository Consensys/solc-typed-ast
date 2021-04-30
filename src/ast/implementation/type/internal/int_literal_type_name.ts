import { InternalTypeName } from "./internal_type_name";

export class IntLiteralTypeName extends InternalTypeName {
    public readonly literal: string;

    constructor(id: number, src: string, type: string, typeString: string, literal: string) {
        super(id, src, type, typeString);
        this.literal = literal;
    }
}
