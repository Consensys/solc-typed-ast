import { ASTNode } from "../../ast_node";
import { VariableDeclaration } from "../declaration/variable_declaration";
import { Expression } from "../expression/expression";
import { Statement } from "./statement";

export class VariableDeclarationStatement extends Statement {
    /**
     * Ids of the variables that are assigned by the statement.
     */
    assignments: Array<number | null>;

    /**
     * An array of variable declarations,
     * e.g. `x` and `y` in `(uint x, uint y) = (1,2)` or `z` in `(uint z) = (1);`
     */
    vDeclarations: VariableDeclaration[];

    /**
     * The expression that is evaluated and assigned as an initial value
     * for the declared variables.
     */
    vInitialValue?: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        assignments: Array<number | null>,
        declarations: VariableDeclaration[],
        initialValue?: Expression,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.assignments = assignments;
        this.vDeclarations = declarations;
        this.vInitialValue = initialValue;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vDeclarations, this.vInitialValue);
    }
}
