import { StructuredDocumentation } from "../../meta";
import { YulASTNode } from "../yul_ast_node";
import { YulStatement, YulStatementWithChildren } from "./yul_statement";

export class YulBlock extends YulStatementWithChildren<
    YulStatement | YulStatementWithChildren<YulASTNode> | StructuredDocumentation
> {
    constructor(
        id: number,
        src: string,
        statements: Iterable<YulStatement>,
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
    get vStatements(): Array<YulStatement | YulStatementWithChildren<YulASTNode>> {
        return this.ownChildren.filter(
            (node) => node instanceof YulStatement || node instanceof YulStatementWithChildren
        );
    }
}
