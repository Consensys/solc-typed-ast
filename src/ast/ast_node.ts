import { ASTNodeFormatter } from "./ast_node_formatter";
import { ASTContext } from "./ast_reader";
import { SourceLocation, parseSourceLocation } from "./utils";

export type ASTNodeCallback = (node: ASTNode) => void;
export type ASTNodeSelector = (node: ASTNode) => boolean;

const formatter = new ASTNodeFormatter();

export class ASTNode {
    /**
     * Current tree context of the node
     */
    context?: ASTContext;

    /**
     * Unique identifier number for the node in the tree context
     */
    id: number;

    /**
     * Source mapping data corresponting to the AST node.
     *
     * The value has format `start:length:sourceIndex`:
     * - `start` is the starting index of the corresponding
     *   code fragment substring in the source string;
     * - `length` is the length of corresponding code fragment substring;
     * - `sourceIndex` is the index number of the source unit (file),
     *   that contains the AST node.
     *
     * To get parsed values, use `sourceInfo` accessor.
     */
    src: string;

    /**
     * Raw original Solc AST node that was used to create current node.
     */
    raw?: any;

    /**
     * The AST node that is containing current node
     */
    parent?: ASTNode;

    constructor(id: number, src: string, raw?: any) {
        this.id = id;
        this.src = src;
        this.raw = raw;
    }

    protected pickNodes(...args: Array<any | Iterable<any>>): ASTNode[] {
        const result: ASTNode[] = [];

        for (const arg of args) {
            if (arg instanceof ASTNode) {
                result.push(arg);
            } else if (arg === null || arg === undefined || typeof arg === "string") {
                continue;
            } else if (typeof arg[Symbol.iterator] === "function") {
                result.push(...this.pickNodes(...arg));
            }
        }

        return result;
    }

    /**
     * Sets `parent` to the current node for each of the accessible children node.
     */
    acceptChildren(): void {
        for (const node of this.children) {
            node.parent = this;
        }
    }

    /**
     * Type of the AST node
     */
    get type(): string {
        return this.constructor.name;
    }

    /**
     * Returns current node AST context. Throws an error if no context is set.
     */
    get requiredContext(): ASTContext {
        if (this.context) {
            return this.context;
        }

        throw new Error("AST context is not set");
    }

    /**
     * Returns children nodes of the current node
     */
    get children(): readonly ASTNode[] {
        return this.pickNodes();
    }

    /**
     * Returns the first immediate child of the node,
     * or `undefined` if the node has no children.
     */
    get firstChild(): ASTNode | undefined {
        return this.children[0];
    }

    /**
     * Returns the last immediate child of the node,
     * or `undefined` if the node has no children.
     */
    get lastChild(): ASTNode | undefined {
        return this.children[this.children.length - 1];
    }

    /**
     * Returns the node immediately preceding the current one
     * in its `parent`'s `children`.
     *
     * Returns `undefined` if the current node is the first child
     * in its `parent`'s children.
     */
    get previousSibling(): ASTNode | undefined {
        if (this.parent === undefined) {
            return undefined;
        }

        const nodes = this.parent.children;
        const index = nodes.indexOf(this);

        return nodes[index - 1];
    }

    /**
     * Returns the node immediately following the current one
     * in its `parent`'s children.
     *
     * Returns `undefined` if the current node is the last child
     * in its `parent`'s children.
     */
    get nextSibling(): ASTNode | undefined {
        if (this.parent === undefined) {
            return undefined;
        }

        const nodes = this.parent.children;
        const index = nodes.indexOf(this);

        return nodes[index + 1];
    }

    /**
     * Returns most parent node in tree hierarchy
     */
    get root(): ASTNode {
        let node: ASTNode = this;

        while (node.parent) {
            node = node.parent;
        }

        return node;
    }

    /**
     * Returns parsed parts of the `src` property value
     */
    get sourceInfo(): SourceLocation {
        return parseSourceLocation(this.src);
    }

    walk(callback: ASTNodeCallback): void {
        const walker = this.createWalker(callback);

        walker(this);
    }

    walkChildren(callback: ASTNodeCallback): void {
        const walker = this.createWalker(callback);

        for (const node of this.children) {
            walker(node);
        }
    }

    walkParents(callback: ASTNodeCallback): void {
        let node: ASTNode | undefined = this.parent;

        while (node) {
            callback(node);

            node = node.parent;
        }
    }

    getChildren(inclusive = false): ASTNode[] {
        const nodes: ASTNode[] = [];
        const callback: ASTNodeCallback = (node) => {
            nodes.push(node);
        };

        if (inclusive) {
            this.walk(callback);
        } else {
            this.walkChildren(callback);
        }

        return nodes;
    }

    getChildrenBySelector<T extends ASTNode>(selector: ASTNodeSelector, inclusive = true): T[] {
        const nodes: T[] = [];
        const callback: ASTNodeCallback = (node) => {
            if (selector(node)) {
                nodes.push(node as T);
            }
        };

        if (inclusive) {
            this.walk(callback);
        } else {
            this.walkChildren(callback);
        }

        return nodes;
    }

    getChildrenByType<T extends ASTNode>(type: ASTNodeConstructor<T>, inclusive = false): T[] {
        return this.getChildrenBySelector((node) => node instanceof type, inclusive);
    }

    getChildrenByTypeString<T extends ASTNode>(typeString: string, inclusive = false): T[] {
        return this.getChildrenBySelector((node) => node.type === typeString, inclusive);
    }

    getParents(): ASTNode[] {
        const nodes: ASTNode[] = [];

        this.walkParents((node) => {
            nodes.push(node);
        });

        return nodes;
    }

    getClosestParentBySelector<T extends ASTNode>(selector: ASTNodeSelector): T | undefined {
        let node = this.parent as T | undefined;

        while (node) {
            if (selector(node)) {
                return node;
            }

            node = node.parent as T | undefined;
        }

        return undefined;
    }

    getClosestParentByType<T extends ASTNode>(type: ASTNodeConstructor<T>): T | undefined {
        return this.getClosestParentBySelector((node) => node instanceof type);
    }

    getClosestParentByTypeString<T extends ASTNode>(typeString: string): T | undefined {
        return this.getClosestParentBySelector((node) => node.type === typeString);
    }

    getParentsBySelector<T extends ASTNode>(selector: ASTNodeSelector): T[] {
        const nodes: T[] = [];
        const callback: ASTNodeCallback = (node) => {
            if (selector(node as T)) {
                nodes.push(node as T);
            }
        };

        this.walkParents(callback);

        return nodes;
    }

    /**
     * Returns string representation of the node properties.

     * @param depth The number of children node levels to output
     */
    print(depth = 0): string {
        return formatter.format(this, depth);
    }

    getFieldValues(): Map<string, any> {
        return new Map(Object.entries(this));
    }

    getGettersValues(): Map<string, any> {
        const getters: string[] = [];

        let proto = Object.getPrototypeOf(this);

        while (proto) {
            for (const name of Object.getOwnPropertyNames(proto)) {
                if (name === "__proto__") {
                    continue;
                }

                const descriptor = Object.getOwnPropertyDescriptor(proto, name);

                if (descriptor && typeof descriptor.get === "function" && !getters.includes(name)) {
                    getters.push(name);
                }
            }

            proto = Object.getPrototypeOf(proto);
        }

        const result = new Map<string, any>();

        for (const g of getters) {
            result.set(g, this[g as keyof this]);
        }

        return result;
    }

    /**
     * Extracts and returns substring from `source`,
     * that corresponds to `src` property value of the current node.
     *
     * In other words, returns corresponding code fragment substring.
     */
    extractSourceFragment(source: Uint8Array): Uint8Array {
        const { offset, length } = this.sourceInfo;

        return source.slice(offset, offset + length);
    }

    private createWalker(callback: ASTNodeCallback): ASTNodeCallback {
        const walker: ASTNodeCallback = (node) => {
            callback(node);

            for (const child of node.children) {
                walker(child);
            }
        };

        return walker;
    }
}

export class ASTNodeWithChildren<T extends ASTNode> extends ASTNode {
    protected ownChildren: T[] = [];

    get children(): readonly T[] {
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

    insertBefore(node: T, referenceNode: T): T {
        const index = this.ownChildren.indexOf(referenceNode);

        if (index === -1) {
            throw new Error("Reference node is not a child of current node");
        }

        this.ownChildren.splice(index, 0, node);

        node.parent = this;

        return node;
    }

    insertAfter(node: T, referenceNode: T): T {
        if (this.ownChildren.indexOf(referenceNode) === -1) {
            throw new Error("Reference node is not a child of current node");
        }

        const sibling = referenceNode.nextSibling as T | undefined;

        return sibling ? this.insertBefore(node, sibling) : this.appendChild(node);
    }

    insertAtBeginning(node: T): T {
        const firstChild = this.firstChild as T | undefined;

        return firstChild ? this.insertBefore(node, firstChild) : this.appendChild(node);
    }

    replaceChild(newNode: T, oldNode: T): T {
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

export type ASTNodeConstructor<T extends ASTNode> = new (
    id: number,
    src: string,
    ...args: any[]
) => T;

/**
 * Replace the node `oldNode` in the tree with `newNode`.
 *
 * If `p` is the parent of `oldNode`, this function needs to find a property
 * `propName` of `p` such that `p[propName] === oldNode`.
 *
 * Once found, it re-assigns `p[propName] = newNode` and sets
 * `newNode.parent=p` using `acceptChildren`. Since `children` is a getter
 * there is nothing further to do.
 */
export function replaceNode(oldNode: ASTNode, newNode: ASTNode): void {
    if (oldNode.context !== newNode.context) {
        throw new Error("Context mismatch");
    }

    const parent = oldNode.parent;

    if (parent === undefined) {
        return;
    }

    const ownProps = Object.getOwnPropertyDescriptors(parent);

    for (const name in ownProps) {
        const val = ownProps[name].value;

        if (val === oldNode) {
            const tmpObj: any = {};

            tmpObj[name] = newNode;

            Object.assign(parent, tmpObj);

            oldNode.parent = undefined;

            parent.acceptChildren();

            return;
        }

        if (val instanceof Array) {
            for (let i = 0; i < val.length; i++) {
                if (val[i] === oldNode) {
                    val[i] = newNode;

                    oldNode.parent = undefined;

                    parent.acceptChildren();

                    return;
                }
            }
        }

        if (val instanceof Map) {
            for (const [k, v] of val.entries()) {
                if (v === oldNode) {
                    val.set(k, newNode);

                    oldNode.parent = undefined;

                    parent.acceptChildren();

                    return;
                }
            }
        }
    }

    throw new Error(
        `Couldn't find child ${oldNode.type}#${oldNode.id} under parent ${parent.type}#${parent.id}`
    );
}
