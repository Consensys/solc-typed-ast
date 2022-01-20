import { StructuredDocumentation } from "../meta";
import { Statement, StatementWithChildren } from "./statement";

/**
 * UncheckedBlock is a compound statement that indicates
 * the underflow and overflow effects are permitted in math expressions.
 */
export class UncheckedBlock extends StatementWithChildren<Statement> {
    constructor(
        id: number,
        src: string,
        statements: Iterable<Statement>,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        for (const statement of statements) {
            this.appendChild(statement);
        }
    }

    /**
     * An array of the member statements
     */
    get vStatements(): Statement[] {
        return this.ownChildren as Statement[];
    }
}
