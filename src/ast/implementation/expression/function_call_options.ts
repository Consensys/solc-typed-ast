import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class FunctionCallOptions extends Expression {
    /**
     * Function expression. For following example:
     * ```
     * foreign.buy{gas: 2000, value: 1 gwei}(1000);
     * ```
     * Will contain `foreign.buy` member access.
     */
    vExpression: Expression;

    /**
     * Option name/value pairs, respecting order.
     */
    vOptionsMap: Map<string, Expression>;

    constructor(
        id: number,
        src: string,
        typeString: string,
        expression: Expression,
        options: Map<string, Expression>,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.vExpression = expression;
        this.vOptionsMap = options;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vExpression, this.vOptions);
    }

    /**
     * Specified option names, respecting order. For following example:
     * ```
     * foreign.buy{gas: 2000, value: 1 gwei}(1000);
     * ```
     * Will contain `["gas", "value"]`.
     */
    get names(): Iterable<string> {
        return this.vOptionsMap.keys();
    }

    /**
     * Specified option values, respecting order. For following example:
     * ```
     * foreign.buy{gas: 2000, value: 1 gwei}(1000);
     * ```
     * Will contain `[2000, 1 gwei]` literal expressions.
     */
    get vOptions(): Iterable<Expression> {
        return this.vOptionsMap.values();
    }
}
