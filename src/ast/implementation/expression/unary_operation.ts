import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class UnaryOperation extends Expression {
    /**
     * Indicates that operator is used as prefix `++x` (`true`)
     * or suffix `x++` (`false`)
     */
    prefix: boolean;

    /**
     * String representation of the operator.
     *
     * Note that `delete` is also an unary operation.
     */
    operator: string;

    /**
     * The expressions that the unary operation is applied to,
     * e.g. `1` for `-1` or `someArray.length` for `someArray.length--`.
     */
    vSubExpression!: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        prefix: boolean,
        operator: string,
        subExpression: Expression,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.prefix = prefix;
        this.operator = operator;

        this.vSubExpression = subExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vSubExpression);
    }
}
