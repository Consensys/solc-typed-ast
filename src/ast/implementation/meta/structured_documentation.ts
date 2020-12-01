import { ASTNode } from "../../ast_node";

export class StructuredDocumentation extends ASTNode {
    /**
     * Documentation content string. May contain newline characters.
     */
    text: string;

    constructor(id: number, src: string, type: string, text: string, raw?: any) {
        super(id, src, type, raw);

        this.text = text;
    }
}
