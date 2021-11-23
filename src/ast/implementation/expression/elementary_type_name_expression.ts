import { ASTNode } from "../../ast_node";
import { ElementaryTypeName } from "../type/elementary_type_name";
import { Expression } from "./expression";

export class ElementaryTypeNameExpression extends Expression {
    /**
     * Name of the conversion function.
     *
     * The value is the type name `string` prior to Solidity 0.6
     * and an instance of `ElementaryTypeName` otherwise.
     */
    typeName: string | ElementaryTypeName;

    constructor(
        id: number,
        src: string,
        typeString: string,
        typeName: string | ElementaryTypeName,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.typeName = typeName;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.typeName);
    }
}
