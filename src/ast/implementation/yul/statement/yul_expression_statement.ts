import { StructuredDocumentation } from "../../meta";
import { YulExpression } from "../expression";
import { YulASTNode } from "../yul_ast_node";
import { YulStatement } from "./yul_statement";
/**
 * An expression, that is specified on a statement level.
 */
export class YulExpressionStatement extends YulStatement {
    /**
     * A contained expression, e.g. `foo(1);` or `x = 1 + 1;`
     */
    vExpression: YulExpression;

    constructor(
        id: number,
        src: string,
        expression: YulExpression,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.vExpression = expression;

        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(this.documentation, this.vExpression);
    }
}
