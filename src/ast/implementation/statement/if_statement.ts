import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { Statement } from "./statement";

export class IfStatement extends Statement {
    /**
     * Condition expression of the statement
     */
    vCondition: Expression;

    /**
     * Statement that gets executed if condition is `true`
     */
    vTrueBody: Statement;

    /**
     * Statement that gets executed if condition is `false`
     */
    vFalseBody?: Statement;

    constructor(
        id: number,
        src: string,
        type: string,
        condition: Expression,
        trueBody: Statement,
        falseBody?: Statement,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.vCondition = condition;
        this.vTrueBody = trueBody;
        this.vFalseBody = falseBody;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vCondition, this.vTrueBody, this.vFalseBody);
    }
}
