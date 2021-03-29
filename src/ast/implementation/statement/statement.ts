import { ASTNode, ASTNodeWithChildren } from "../../ast_node";

export class Statement extends ASTNode {
    /**
     * Optional documentation appearing above the statement:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     */
    documentation?: string;

    constructor(id: number, src: string, type: string, documentation?: string, raw?: any) {
        super(id, src, type, raw);

        this.documentation = documentation;
    }
}

export class StatementWithChildren<T extends ASTNode> extends ASTNodeWithChildren<T> {
    /**
     * Optional documentation appearing above the statement:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     */
    documentation?: string;

    constructor(id: number, src: string, type: string, documentation?: string, raw?: any) {
        super(id, src, type, raw);

        this.documentation = documentation;
    }
}
