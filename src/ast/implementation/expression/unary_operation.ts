import { ASTNode } from "../../ast_node";
import { FunctionDefinition } from "../declaration";
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
        prefix: boolean,
        operator: string,
        subExpression: Expression,
        userFunction?: number,
        raw?: any
    ) {
        super(id, src, typeString, raw);

        this.prefix = prefix;
        this.operator = operator;
        this.userFunction = userFunction;

        this.vSubExpression = subExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vSubExpression);
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
