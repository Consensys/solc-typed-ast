import { InternalTypeName } from "./internal_type_name";

export class BuiltinStructTypeName extends InternalTypeName {
    public readonly builtin: string;

    constructor(id: number, src: string, type: string, typeString: string, builtin: string) {
        super(id, src, type, typeString);
        this.builtin = builtin;
    }
}
