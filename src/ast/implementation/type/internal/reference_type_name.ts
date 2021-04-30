import { DataLocation } from "../../../constants";
import { TypeName } from "../type_name";
import { InternalTypeName } from "./internal_type_name";

export class ReferenceTypeName extends InternalTypeName {
    public readonly toType: TypeName;
    public readonly location: DataLocation;
    public readonly kind?: "pointer" | "ref" | "slice";

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        toType: TypeName,
        location: DataLocation,
        kind?: "pointer" | "ref" | "slice"
    ) {
        super(id, src, type, typeString);
        this.toType = toType;
        this.location = location;
        this.kind = kind;
    }
}
