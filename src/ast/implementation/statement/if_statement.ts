import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { StructuredDocumentation } from "../meta";
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
        condition: Expression,
        trueBody: Statement,
        falseBody?: Statement,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.vCondition = condition;
        this.vTrueBody = trueBody;
        this.vFalseBody = falseBody;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vCondition, this.vTrueBody, this.vFalseBody);
    }
}
