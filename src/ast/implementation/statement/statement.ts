import { ASTNode, ASTNodeWithChildren } from "../../ast_node";
import { StructuredDocumentation } from "../meta";

export class Statement extends ASTNode {
    /**
     * Optional documentation appearing above the statement:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     */
    documentation?: string | StructuredDocumentation;

    constructor(
        id: number,
        src: string,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, raw);

        this.documentation = documentation;
    }
}

export class StatementWithChildren<T extends ASTNode> extends ASTNodeWithChildren<T> {
    /**
     * Optional documentation appearing above the statement:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     */
    documentation?: string | StructuredDocumentation;

    constructor(
        id: number,
        src: string,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, raw);

        this.documentation = documentation;
    }
}
