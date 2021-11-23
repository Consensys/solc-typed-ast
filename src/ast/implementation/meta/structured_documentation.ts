import { ASTNode } from "../../ast_node";

export class StructuredDocumentation extends ASTNode {
    /**
     * Documentation content string. May contain newline characters.
     */
    text: string;

    constructor(id: number, src: string, text: string, raw?: any) {
        super(id, src, raw);

        this.text = text;
    }
}
