import { ASTNode } from "../../ast_node";

export class PragmaDirective extends ASTNode {
    /**
     * An array representing literals of the pragma identifier and value parts,
     * e.g. `[ "solidity", "^", "0.4", ".15" ]`.
     */
    literals: string[];

    constructor(id: number, src: string, literals: string[], raw?: any) {
        super(id, src, raw);

        this.literals = literals;
    }

    /**
     * The first element of literals specifying the type of pragma,
     * e.g. `experimental` or `solidity`.
     */
    get vIdentifier(): string {
        return this.literals[0];
    }

    /**
     * The rest of the literal elements, e.g. `[ "^", "0.4", ".15" ]`
     */
    get vValue(): string {
        return this.literals.slice(1).join("");
    }
}
