import { TypeName } from "../type_name";
import { InternalTypeName } from "./internal_type_name";

export class TupleTypeName extends InternalTypeName {
    public readonly components: Array<TypeName | null>;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        components: Array<TypeName | null>
    ) {
        super(id, src, type, typeString);
        this.components = components;
    }
}
