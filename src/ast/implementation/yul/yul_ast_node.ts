import { ASTNode, ASTNodeWithChildren } from "../../ast_node";
import { InlineAssembly } from "../statement";

export function isYulASTNode(
    node: ASTNode
): node is YulASTNode | YulASTNodeWithChildren<YulASTNode> {
    return node instanceof YulASTNode || node instanceof YulASTNodeWithChildren;
}

export class YulASTNode extends ASTNode {}

export interface YulASTNode {
    get children(): readonly YulASTNode[];
    get firstChild(): ASTNode | undefined;
    get lastChild(): YulASTNode | undefined;
    get previousSibling(): YulASTNode | undefined;
    get nextSibling(): YulASTNode | undefined;

    parent?: YulASTNode | InlineAssembly;

    walk(callback: YulASTNodeCallback): void;
    walkChildren(callback: YulASTNodeCallback): void;

    getChildren(inclusive?: boolean): YulASTNode[];
    getChildrenBySelector<T extends YulASTNode>(
        selector: YulASTNodeSelector,
        inclusive?: boolean
    ): T[];
    getChildrenByType<T extends YulASTNode>(
        type: YulASTNodeConstructor<T>,
        inclusive?: boolean
    ): T[];
    getChildrenByTypeString<T extends YulASTNode>(typeString: string, inclusive?: boolean): T[];
}

export class YulASTNodeWithChildren<T extends YulASTNode>
    extends ASTNodeWithChildren<T>
    implements YulASTNode
{
    protected ownChildren: YulASTNode[] = [];

    get children(): readonly YulASTNode[] {
        return this.ownChildren;
    }

    removeChild(node: T): T {
        const index = this.ownChildren.indexOf(node);

        if (index === -1) {
            throw new Error("Reference node is not a child of current node");
        }

        this.ownChildren.splice(index, 1);

        node.parent = undefined;

        return node;
    }

    appendChild(node: T): T {
        this.ownChildren.push(node);

        node.parent = this;

        return node;
    }

    insertBefore(node: T, referenceNode: YulASTNode): T {
        const index = this.ownChildren.indexOf(referenceNode);

        if (index === -1) {
            throw new Error("Reference node is not a child of current node");
        }

        this.ownChildren.splice(index, 0, node);

        node.parent = this;

        return node;
    }

    insertAfter(node: T, referenceNode: YulASTNode): T {
        if (this.ownChildren.indexOf(referenceNode) === -1) {
            throw new Error("Reference node is not a child of current node");
        }

        const sibling = referenceNode.nextSibling;

        return sibling ? this.insertBefore(node, sibling) : this.appendChild(node);
    }

    insertAtBeginning(node: T): T {
        const firstChild = this.firstChild;

        return firstChild ? this.insertBefore(node, firstChild) : this.appendChild(node);
    }

    replaceChild<N extends T, O extends T>(newNode: N, oldNode: O): O {
        const index = this.ownChildren.indexOf(oldNode);

        if (index === -1) {
            throw new Error("Old node is not a child of current node");
        }

        this.ownChildren.splice(index, 1, newNode);

        newNode.parent = this;
        oldNode.parent = undefined;

        return oldNode;
    }
}

export type YulASTNodeConstructor<T extends YulASTNode> = new (
    id: number,
    src: string,
    ...args: any[]
) => T;

export type YulASTNodeCallback = (node: YulASTNode) => void;
export type YulASTNodeSelector = (node: YulASTNode) => boolean;
