import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class Assignment extends Expression {
    /**
     * String representation of the operator, e.g. `+=` in `a += 2`
     */
    operator: string;

    /**
     * Left hand side expression, e.g. `a` in `a += 2`
     */
    vLeftHandSide: Expression;

    /**
     * Right hand side expression, e.g. `2` in `a += 2`
     */
    vRightHandSide: Expression;

    constructor(
        id: number,
        src: string,
        typeString: string,
        operator: string,
        leftHandSide: Expression,
        rightHandSide: Expression,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.operator = operator;

        this.vLeftHandSide = leftHandSide;
        this.vRightHandSide = rightHandSide;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vLeftHandSide, this.vRightHandSide);
    }
}
