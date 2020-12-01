import { ASTNode } from "./ast_node";

const jSel = require("jsel");

/* istanbul ignore next */
jSel.addFunction(null, "is", (...args: any[]) => {
    if (args.length !== 2) {
        throw new Error('Function "is" expects (object)');
    }

    const [context, pathExpr] = args;

    const value = pathExpr.evaluate(context);

    if (value.constructor.name === "XNodeSet") {
        const tree = value.tree;

        if (tree && tree.node && !tree.node.value) {
            value.tree = null;
        }
    }

    return value.bool();
});

interface SchemaInterface {
    nodeName: (node: any) => string;
    childNodes: (node: any) => readonly any[];
    attributes: (node: any) => { [attribute: string]: any };
    nodeValue: (node: any) => any;
}

const SKIP = new Set(["context", "requiredContext", "raw", "children", "ownChildren"]);

const ASTNodeSchema: SchemaInterface = {
    nodeName: (node: ASTNode) => node.type,
    childNodes: (node: ASTNode) => node.children,

    attributes: (node: ASTNode) => {
        const attrs: any = {};

        for (const [k, v] of node.getFieldValues().entries()) {
            if (SKIP.has(k)) {
                continue;
            }

            attrs[k] = v;
        }

        for (const [g, v] of node.getGettersValues().entries()) {
            if (SKIP.has(g)) {
                continue;
            }

            attrs[g] = v;
        }

        return attrs;
    },

    nodeValue: () => undefined
};

export class XPath {
    private dom: any;

    constructor(node: ASTNode) {
        const dom = jSel(node);

        dom.schema(ASTNodeSchema);

        this.dom = dom;
    }

    query(path: string): any {
        return this.dom.selectAll(path);
    }
}
