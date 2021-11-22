import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { StructuredDocumentation } from "../meta";
import { Statement } from "./statement";

/**
 * An expression, that is specified on a statement level.
 */
export class ExpressionStatement extends Statement {
    /**
     * A contained expression, e.g. `foo(1);` or `x = 1 + 1;`
     */
    vExpression: Expression;

    constructor(
        id: number,
        src: string,
        expression: Expression,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.vExpression = expression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vExpression);
    }
}
