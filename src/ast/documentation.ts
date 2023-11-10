import { ASTNode, ASTNodeWithChildren } from "./ast_node";
import { StructuredDocumentation } from "./implementation/meta";

export interface WithPrecedingDocs {
    documentation?: string | StructuredDocumentation;

    /**
     * This field is used as a storage field for string,
     * if string is set as value for `documentation`.
     */
    docString?: string;
}

export interface WithDanglingDocs {
    danglingDocumentation?: string | StructuredDocumentation;

    /**
     * This field is used as a storage field for string,
     * if string is set as value for `danglingDocumentation`.
     */
    danglingDocString?: string;
}

export function getDocumentation(
    node: WithPrecedingDocs & ASTNodeWithChildren<ASTNode>
): string | StructuredDocumentation | undefined {
    if (node.docString !== undefined) {
        return node.docString;
    }

    const ownLoc = node.sourceInfo;
    const children = node.children;

    for (let c = 0; c < children.length; c++) {
        const child = children[c];

        if (child instanceof StructuredDocumentation) {
            const childLoc = child.sourceInfo;

            /**
             * Note that preceding documentation nodes are
             * EXCLUDED from source range of parent node.
             */
            if (childLoc.offset <= ownLoc.offset) {
                return child;
            }
        }
    }

    return undefined;
}

export function setDocumentation(
    node: WithPrecedingDocs & ASTNodeWithChildren<ASTNode>,
    value: string | StructuredDocumentation | undefined
): void {
    const old = node.documentation;

    if (value instanceof StructuredDocumentation) {
        node.docString = undefined;

        if (old instanceof StructuredDocumentation) {
            if (value !== old) {
                node.replaceChild(value, old);
            }
        } else {
            node.insertAtBeginning(value);
        }
    } else {
        if (old instanceof StructuredDocumentation) {
            node.removeChild(old);
        }

        node.docString = value;
    }
}

export function getDanglingDocumentation(
    node: WithDanglingDocs & ASTNodeWithChildren<ASTNode>
): string | StructuredDocumentation | undefined {
    if (node.danglingDocString !== undefined) {
        return node.danglingDocString;
    }

    const ownLoc = node.sourceInfo;
    const children = node.children;

    for (let c = children.length - 1; c >= 0; c--) {
        const child = children[c];

        if (child instanceof StructuredDocumentation) {
            const childLoc = child.sourceInfo;

            /**
             * Note that preceding documentation nodes are
             * INCLUDED from source range of parent node.
             */
            if (childLoc.offset > ownLoc.offset) {
                return child;
            }
        }
    }

    return undefined;
}

export function setDanglingDocumentation(
    node: WithDanglingDocs & ASTNodeWithChildren<ASTNode>,
    value: string | StructuredDocumentation | undefined
): void {
    const old = node.danglingDocumentation;

    if (value instanceof StructuredDocumentation) {
        node.danglingDocString = undefined;

        if (old instanceof StructuredDocumentation) {
            if (value !== old) {
                node.replaceChild(value, old);
            }
        } else {
            node.appendChild(value as any);
        }
    } else {
        if (old instanceof StructuredDocumentation) {
            node.removeChild(old as any);
        }

        node.danglingDocString = value;
    }
}
