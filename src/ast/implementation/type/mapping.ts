import { ASTNode } from "../../ast_node";
import { TypeName } from "./type_name";

export class Mapping extends TypeName {
    /**
     * A mapping key type: any built-in **value** type,
     * including `bytes`, `string`, contract and enum types.
     */
    vKeyType: TypeName;

    /**
     * A mapping value type.
     */
    vValueType: TypeName;

    constructor(
        id: number,
        src: string,
        typeString: string,
        keyType: TypeName,
        valueType: TypeName,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.vKeyType = keyType;
        this.vValueType = valueType;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vKeyType, this.vValueType);
    }
}
