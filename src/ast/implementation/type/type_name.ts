import { ASTNode } from "../../ast_node";

export class TypeName extends ASTNode {
    /**
     * Type string, e.g. `uint256`
     */
    typeString: string;

    constructor(id: number, src: string, type: string, typeString: string, raw?: any) {
        super(id, src, type, raw);

        this.typeString = typeString;
    }
}

export type TypeNameConstructor<T extends TypeName> = new (
    id: number,
    src: string,
    type: string,
    typeString: string,
    ...args: any[]
) => T;
