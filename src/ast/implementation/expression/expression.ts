import { ASTNode } from "../../ast_node";

export class Expression extends ASTNode {
    /**
     * Type string, e.g. `uint256`
     */
    typeString: string;

    constructor(id: number, src: string, type: string, typeString: string, raw?: any) {
        super(id, src, type, raw);

        this.typeString = typeString;
    }
}

export type ExpressionConstructor<T extends Expression> = new (
    id: number,
    src: string,
    type: string,
    typeString: string,
    ...args: any[]
) => T;
