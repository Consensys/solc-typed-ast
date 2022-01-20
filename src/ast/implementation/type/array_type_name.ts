import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { TypeName } from "./type_name";

export class ArrayTypeName extends TypeName {
    /**
     * Type of array elements
     */
    vBaseType: TypeName;

    /**
     * Length of the array.
     * If array type is unbounded (or dynamic) the value is `undefined`.
     */
    vLength?: Expression;

    constructor(
        id: number,
        src: string,
        typeString: string,
        baseType: TypeName,
        length?: Expression,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.vBaseType = baseType;
        this.vLength = length;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vBaseType, this.vLength);
    }
}
