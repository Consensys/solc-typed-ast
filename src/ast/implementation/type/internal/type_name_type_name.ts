import { TypeName } from "..";
import { InternalTypeName } from "./internal_type_name";

export class TypeNameTypeName extends InternalTypeName {
    public readonly innerType: TypeName;

    constructor(id: number, src: string, type: string, typeString: string, innerType: TypeName) {
        super(id, src, type, typeString);
        this.innerType = innerType;
    }
}
