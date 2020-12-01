import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class BinaryOperation extends Expression {
    /**
     * String representation of the operator, e.g. `+` in `1 + 2`
     */
    operator: string;

    /**
     * Left hand side expression, e.g. `1` in `1 + 2`
     */
    vLeftExpression: Expression;

    /**
     * Right hand side expression, e.g. `2` in `1 + 2`
     */
    vRightExpression: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        operator: string,
        leftExpression: Expression,
        rightExpression: Expression,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.operator = operator;

        this.vLeftExpression = leftExpression;
        this.vRightExpression = rightExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vLeftExpression, this.vRightExpression);
    }
}
