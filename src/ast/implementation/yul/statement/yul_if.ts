import { YulASTNode } from "../yul_ast_node";
import { YulExpression } from "../expression";
import { StructuredDocumentation } from "../../meta";
import { YulBlock } from "./yul_block";
import { YulStatement } from "./yul_statement";

export class YulIf extends YulStatement {
    /**
     * Condition expression of the statement
     */
    vCondition: YulExpression;

    /**
     * YulBlock that gets executed if condition is truthy
     */
    vBody: YulBlock;

    constructor(
        id: number,
        src: string,
        condition: YulExpression,
        body: YulBlock,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.vCondition = condition;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(this.documentation, this.vCondition, this.vBody);
    }
}
