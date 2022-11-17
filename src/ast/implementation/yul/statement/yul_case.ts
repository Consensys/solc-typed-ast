import { StructuredDocumentation } from "../../meta";
import { YulLiteral } from "../expression";
import { YulASTNode } from "../yul_ast_node";
import { YulBlock } from "./yul_block";
import { YulStatement } from "./yul_statement";

export class YulCase extends YulStatement {
    value: YulLiteral | "default";

    vBody: YulBlock;

    constructor(
        id: number,
        src: string,
        value: YulLiteral | "default",
        body: YulBlock,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);
        this.value = value;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(this.documentation, this.value, this.vBody);
    }
}
