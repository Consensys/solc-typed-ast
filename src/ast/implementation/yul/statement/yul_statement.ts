import { YulASTNode, YulASTNodeWithChildren } from "../yul_ast_node";
import {
    getDanglingDocumentation,
    getDocumentation,
    setDanglingDocumentation,
    setDocumentation,
    WithDanglingDocs,
    WithPrecedingDocs
} from "../../../documentation";
import { StructuredDocumentation } from "../../meta";

export class YulStatement extends YulASTNode {
    /**
     * Optional documentation appearing above the statement:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     */
    documentation?: string | StructuredDocumentation;

    constructor(
        id: number,
        src: string,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, raw);

        this.documentation = documentation;
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(this.documentation);
    }
}

export class YulStatementWithChildren<T extends YulASTNode | StructuredDocumentation>
    extends YulASTNodeWithChildren<T>
    implements WithPrecedingDocs, WithDanglingDocs
{
    docString?: string;
    danglingDocString?: string;

    constructor(
        id: number,
        src: string,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, raw);

        this.documentation = documentation;
    }

    /**
     * Optional documentation appearing above the contract definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    get documentation(): string | StructuredDocumentation | undefined {
        return getDocumentation(this);
    }

    set documentation(value: string | StructuredDocumentation | undefined) {
        setDocumentation(this, value);
    }

    /**
     * Optional documentation that is dangling in the source fragment,
     * that is after end of last child and before the end of the current node.
     *
     * It is:
     * - Is `undefined` when not detected.
     * - Is type of `string` for compatibility reasons.
     */
    get danglingDocumentation(): string | StructuredDocumentation | undefined {
        return getDanglingDocumentation(this);
    }

    set danglingDocumentation(value: string | StructuredDocumentation | undefined) {
        setDanglingDocumentation(this, value);
    }
}
