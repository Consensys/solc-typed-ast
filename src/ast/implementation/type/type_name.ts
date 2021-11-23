import { ASTNode } from "../../ast_node";

export class TypeName extends ASTNode {
    /**
     * Type string, e.g. `uint256`
     */
    typeString: string;

    constructor(id: number, src: string, typeString: string, raw?: any) {
        super(id, src, raw);

        this.typeString = typeString;
    }
}

export type TypeNameConstructor<T extends TypeName> = new (
    id: number,
    src: string,
    typeString: string,
    ...args: any[]
) => T;
