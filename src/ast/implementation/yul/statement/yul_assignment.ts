import { StructuredDocumentation } from "../../meta";
import { YulExpression, YulIdentifier } from "../expression";
import { YulASTNode } from "../yul_ast_node";

import { YulStatement } from "./yul_statement";

export class YulAssignment extends YulStatement {
    variableNames: YulIdentifier[];

    value: YulExpression;

    constructor(
        id: number,
        src: string,
        variableNames: YulIdentifier[],
        value: YulExpression,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);
        this.variableNames = variableNames;
        this.value = value;
        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(this.documentation, this.variableNames, this.value);
    }
}
