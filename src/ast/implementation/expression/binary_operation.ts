import { ASTNode } from "../../ast_node";
import { FunctionDefinition } from "../declaration";
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

    /**
     * Custom defintion that is bound to operator and used instead of default logic.
     *
     * Available since Solidity 0.8.19.
     */
    userFunction?: number;

    constructor(
        id: number,
        src: string,
        typeString: string,
        operator: string,
        leftExpression: Expression,
        rightExpression: Expression,
        userFunction?: number,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.operator = operator;

        this.vLeftExpression = leftExpression;
        this.vRightExpression = rightExpression;
        this.userFunction = userFunction;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vLeftExpression, this.vRightExpression);
    }

    /**
     * Attribute to access the defintion, bound to the operator.
     *
     * Is `undefined` when there is no definition bound to the operator.
     */
    get vUserFunction(): FunctionDefinition | undefined {
        if (!this.userFunction) {
            return undefined;
        }

        const def = this.requiredContext.locate(this.userFunction);

        if (def instanceof FunctionDefinition) {
            return def;
        }

        throw new Error(
            `Invalid function reference for operation "${this.operator}" of node ${this.type}#${this.id}`
        );
    }

    set vUserFunction(value: FunctionDefinition | undefined) {
        if (value === undefined) {
            this.userFunction = undefined;
        } else {
            if (!this.requiredContext.contains(value)) {
                throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
            }

            this.userFunction = value.id;
        }
    }
}
