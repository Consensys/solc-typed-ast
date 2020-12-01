import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class TupleExpression extends Expression {
    /**
     * Indicate if tuple is an inline array definition.
     */
    isInlineArray: boolean;

    /**
     * An array of referenced nodes, preserving evaluation order.
     *
     * The `null` value is used to represent empty spots.
     */
    vOriginalComponents: Array<Expression | null>;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        isInlineArray: boolean,
        components: Array<Expression | null>,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.isInlineArray = isInlineArray;
        this.vOriginalComponents = components;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.vComponents;
    }

    /**
     * An array of referenced node IDs, preserving evaluation order.
     *
     * The `null` value is used to represent empty spots.
     */
    get components(): Array<number | null> {
        const result: Array<number | null> = [];

        for (const component of this.vOriginalComponents) {
            result.push(component === null ? null : component.id);
        }

        return result;
    }

    /**
     * An array of non-`null` components
     */
    get vComponents(): Expression[] {
        const result: Expression[] = [];

        for (const component of this.vOriginalComponents) {
            if (component !== null) {
                result.push(component);
            }
        }

        return result;
    }
}
