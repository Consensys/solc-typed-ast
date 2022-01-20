import { ASTNode } from "../../ast_node";

export class EnumValue extends ASTNode {
    /**
     * Member value
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    constructor(id: number, src: string, name: string, nameLocation?: string, raw?: any) {
        super(id, src, raw);

        this.name = name;
        this.nameLocation = nameLocation;
    }
}
