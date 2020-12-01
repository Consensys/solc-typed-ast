import { ASTNode } from "../../ast_node";
import { TypeName } from "./type_name";

export class UserDefinedTypeName extends TypeName {
    /**
     * Name of the defined type
     */
    name: string;

    /**
     * Id of the referenced declaration node
     */
    referencedDeclaration: number;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        name: string,
        referencedDeclaration: number,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.name = name;
        this.referencedDeclaration = referencedDeclaration;
    }

    /**
     * Reference to the declaration
     */
    get vReferencedDeclaration(): ASTNode {
        return this.requiredContext.locate(this.referencedDeclaration);
    }

    set vReferencedDeclaration(value: ASTNode) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.referencedDeclaration = value.id;
    }
}
