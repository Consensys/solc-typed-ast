import { ASTNodeWithChildren } from "../../ast_node";
import { VariableDeclaration } from "../declaration/variable_declaration";

export class ParameterList extends ASTNodeWithChildren<VariableDeclaration> {
    constructor(
        id: number,
        src: string,
        type: string,
        parameters: Iterable<VariableDeclaration>,
        raw?: any
    ) {
        super(id, src, type, raw);

        for (const parameter of parameters) {
            this.appendChild(parameter);
        }
    }

    /**
     * An array of declared variables
     */
    get vParameters(): VariableDeclaration[] {
        return this.ownChildren as VariableDeclaration[];
    }
}
