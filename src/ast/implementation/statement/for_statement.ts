import { ASTNode } from "../../ast_node";
import { Expression } from "../expression/expression";
import { ExpressionStatement } from "./expression_statement";
import { Statement } from "./statement";
import { VariableDeclarationStatement } from "./variable_declaration_statement";

export class ForStatement extends Statement {
    /**
     * Variable declaration and initialization `uint x = 1`.
     * Also accepts other expression statements.
     */
    vInitializationExpression?: VariableDeclarationStatement | ExpressionStatement;

    /**
     * Continuation condition, e.g. `x < 10`
     */
    vCondition?: Expression;

    /**
     * Loop expression, e.g. `x++`
     */
    vLoopExpression?: ExpressionStatement;

    /**
     * Statement that gets executed if the condition is evaluated to `true`
     */
    vBody: Statement;

    constructor(
        id: number,
        src: string,
        type: string,
        body: Statement,
        initializationExpression?: VariableDeclarationStatement | ExpressionStatement,
        condition?: Expression,
        loopExpression?: ExpressionStatement,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.vInitializationExpression = initializationExpression;
        this.vCondition = condition;
        this.vLoopExpression = loopExpression;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(
            this.vInitializationExpression,
            this.vCondition,
            this.vLoopExpression,
            this.vBody
        );
    }
}
