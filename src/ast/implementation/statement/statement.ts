import { ASTNode, ASTNodeWithChildren } from "../../ast_node";
import { StructuredDocumentation } from "../meta";

export class Statement extends ASTNode {
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

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.documentation);
    }
}

export class StatementWithChildren<T extends ASTNode> extends ASTNodeWithChildren<T> {
    private docString?: string;
    private danglingDocString?: string;

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
        if (this.docString !== undefined) {
            return this.docString;
        }

        const ownLoc = this.sourceInfo;

        for (let c = 0; c < this.ownChildren.length; c++) {
            const child = this.ownChildren[c];

            if (child instanceof StructuredDocumentation) {
                const childLoc = child.sourceInfo;

                if (childLoc.offset <= ownLoc.offset) {
                    return child;
                }
            }
        }

        return undefined;
    }

    set documentation(value: string | StructuredDocumentation | undefined) {
        const old = this.documentation;

        if (value instanceof StructuredDocumentation) {
            this.docString = undefined;

            if (old instanceof StructuredDocumentation) {
                if (value !== old) {
                    this.replaceChild<any, any>(value, old);
                }
            } else {
                this.insertAtBeginning(value as any);
            }
        } else {
            if (old instanceof StructuredDocumentation) {
                this.removeChild(old as any);
            }

            this.docString = value;
        }
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
        if (this.danglingDocString !== undefined) {
            return this.danglingDocString;
        }

        const ownLoc = this.sourceInfo;

        for (let c = this.ownChildren.length - 1; c >= 0; c--) {
            const child = this.ownChildren[c];

            if (child instanceof StructuredDocumentation) {
                const childLoc = child.sourceInfo;

                if (childLoc.offset > ownLoc.offset) {
                    return child;
                }
            }
        }

        return undefined;
    }

    set danglingDocumentation(value: string | StructuredDocumentation | undefined) {
        const old = this.danglingDocumentation;

        if (value instanceof StructuredDocumentation) {
            this.danglingDocString = undefined;

            if (old instanceof StructuredDocumentation) {
                if (value !== old) {
                    this.replaceChild<any, any>(value, old);
                }
            } else {
                this.appendChild(value as any);
            }
        } else {
            if (old instanceof StructuredDocumentation) {
                this.removeChild(old as any);
            }

            this.danglingDocString = value;
        }
    }
}
