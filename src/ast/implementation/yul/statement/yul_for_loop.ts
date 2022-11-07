import { YulASTNode } from "../yul_ast_node";
import { YulExpression } from "../expression/yul_expression";
import { StructuredDocumentation } from "../../meta";
import { YulBlock } from "./yul_block";
import { YulStatement } from "./yul_statement";

export class YulForLoop extends YulStatement {
    /**
     * Variable declaration and initialization `uint x = 1`.
     * Also accepts other expression statements.
     */
    vPre: YulBlock;

    /**
     * Continuation condition, e.g. `x < 10`
     */
    vCondition: YulExpression;

    /**
     * Loop expression, e.g. `x++`
     */
    vPost: YulBlock;

    /**
     * YulBlock that gets executed if the condition is evaluated to `true`
     */
    vBody: YulBlock;

    constructor(
        id: number,
        src: string,
        pre: YulBlock,
        condition: YulExpression,
        post: YulBlock,
        body: YulBlock,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.vPre = pre;
        this.vCondition = condition;
        this.vPost = post;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(
            this.documentation,
            this.vPre,
            this.vCondition,
            this.vPost,
            this.vBody
        );
    }
}
