import { ASTNodeWithChildren } from "../../ast_node";
import { VariableDeclaration } from "../declaration/variable_declaration";

export class ParameterList extends ASTNodeWithChildren<VariableDeclaration> {
    constructor(id: number, src: string, parameters: Iterable<VariableDeclaration>, raw?: any) {
        super(id, src, raw);

        for (const parameter of parameters) {
            this.appendChild(parameter);
        }
    }

    /**
     * An array of declared variables
     */
    get vParameters(): VariableDeclaration[] {
        return this.ownChildren;
    }
}
