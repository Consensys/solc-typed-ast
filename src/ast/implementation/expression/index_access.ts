import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class IndexAccess extends Expression {
    /**
     * The expression that is accessed e.g. `someArray` in `someArray[index]`
     */
    vBaseExpression: Expression;

    /**
     * Access the index of an expression, e.g. `index` in `someArray[index]`.
     *
     * May be `undefined` if used with `abi.decode()`,
     * for example `abi.decode(data, uint[]);`.
     */
    vIndexExpression?: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        baseExpression: Expression,
        indexExpression?: Expression,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.vBaseExpression = baseExpression;
        this.vIndexExpression = indexExpression;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vBaseExpression, this.vIndexExpression);
    }
}
