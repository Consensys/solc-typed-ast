import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class Conditional extends Expression {
    /**
     * The condition expression, e.g. `a > b` in `a > b ? (a + 1) : (b + 1)`.
     */
    vCondition: Expression;

    /**
     * The expression, that is returned when condition is evaluated to `true`.
     *
     * E.g. `(a + 1)` in `a > b ? (a + 1) : (b + 1)`.
     */
    vTrueExpression: Expression;

    /**
     * The expression, that is returned when condition is evaluated to `false`.
     *
     * E.g. `(b + 1)` in `a > b ? (a + 1) : (b + 1)`.
     */
    vFalseExpression: Expression;

    constructor(
        id: number,
        src: string,
        typeString: string,
        condition: Expression,
        trueExpression: Expression,
        falseExpression: Expression,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.vCondition = condition;
        this.vTrueExpression = trueExpression;
        this.vFalseExpression = falseExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vCondition, this.vTrueExpression, this.vFalseExpression);
    }
}
