import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { UserDefinedTypeName } from "../type/user_defined_type_name";

export class InheritanceSpecifier extends ASTNode {
    /**
     * A base contract type
     */
    vBaseType: UserDefinedTypeName;

    /**
     * Arguments for the base contract constructor call
     */
    vArguments: Expression[];

    constructor(
        id: number,
        src: string,
        type: string,
        baseType: UserDefinedTypeName,
        args: Expression[],
        raw?: any
    ) {
        super(id, src, type, raw);

        this.vBaseType = baseType;
        this.vArguments = args;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vBaseType, this.vArguments);
    }
}
