import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class IndexRangeAccess extends Expression {
    /**
     * The expression that is accessed e.g. `data` in `data[2:4]`
     */
    vBaseExpression: Expression;

    /**
     * Start index of the range, e.g. `2` in `data[2:4]`.
     * Is `undefined` when omitted.
     */
    vStartExpression?: Expression;

    /**
     * End index of the range, e.g. `4` in `data[2:4]`.
     * Is `undefined` when omitted.
     */
    vEndExpression?: Expression;

    constructor(
        id: number,
        src: string,
        typeString: string,
        baseExpression: Expression,
        startExpression?: Expression,
        endExpression?: Expression,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.vBaseExpression = baseExpression;
        this.vStartExpression = startExpression;
        this.vEndExpression = endExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vBaseExpression, this.vStartExpression, this.vEndExpression);
    }
}
