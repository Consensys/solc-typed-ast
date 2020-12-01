import { ASTNode } from "../../ast_node";

export class EnumValue extends ASTNode {
    /**
     * Member value
     */
    name: string;

    constructor(id: number, src: string, type: string, name: string, raw?: any) {
        super(id, src, type, raw);

        this.name = name;
    }
}
