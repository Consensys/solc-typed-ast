import { ASTContext, ASTNode, YulASTNode, YulASTNodeWithChildren } from "./";

const INDENT = " ".repeat(4);
const SKIP = new Set(["requiredContext", "raw", "ownChildren"]);

export class ASTNodeFormatter {
    format(value: any, depth = 0): string {
        return value instanceof ASTNode
            ? this.formatNode(value, 0, depth)
            : this.formatValue(value);
    }

    private formatContextValue(context: ASTContext): string {
        return context.constructor.name + " #" + context.id;
    }

    private formatNodeValue(node: ASTNode): string {
        return `${node.type} #${node.id}`;
    }

    private formatArrayValue(array: any[]): string {
        const length = array.length;

        if (length === 0) {
            return "Array(0)";
        }

        const output = array.map((element) => this.formatValue(element));

        return `Array(${length}) [ ${output.join(", ")} ]`;
    }

    private formatObjectValue(object: any): string {
        if (object === null) {
            return String(object);
        }

        const entries = Object.entries(object);
        const constructor = object.constructor.name;

        if (!entries.length) {
            return `${constructor} {}`;
        }

        const output = entries.map(
            ([property, value]) => property + ": " + this.formatValue(value)
        );

        return `${constructor} { ${output.join(", ")} }`;
    }

    private formatMapValue(map: Map<any, any>): string {
        const size = map.size;

        if (size === 0) {
            return "Map(0)";
        }

        const output = [];

        for (const [key, value] of map.entries()) {
            output.push(this.formatValue(key) + " -> " + this.formatValue(value));
        }

        return `Map(${size}) { ${output.join(", ")} }`;
    }

    private formatSetValue(set: Set<any>): string {
        const size = set.size;

        if (size === 0) {
            return "Set(0)";
        }

        const output = [];

        for (const value of set.values()) {
            output.push(this.formatValue(value));
        }

        return `Set(${size}) { ${output.join(", ")} }`;
    }

    private formatNode(node: ASTNode, level: number, depth: number): string {
        if (node instanceof YulASTNode || node instanceof YulASTNodeWithChildren) {
            return this.formatValue(node.raw);
        }
        const output = [];
        const value = this.formatNodeValue(node);

        const nodeIndent = INDENT.repeat(level);
        const propertyIndent = INDENT.repeat(level + 1);

        output.push(nodeIndent + value);

        for (const [k, v] of node.getFieldValues().entries()) {
            if (SKIP.has(k)) {
                continue;
            }

            output.push(propertyIndent + k + ": " + this.formatValue(v));
        }

        for (const [g, v] of node.getGettersValues().entries()) {
            if (SKIP.has(g)) {
                continue;
            }

            output.push(propertyIndent + `<getter> ${g}: ` + this.formatValue(v));
        }

        output.push("");

        if (depth > 0) {
            for (const child of node.children) {
                output.push(this.formatNode(child, level + 1, depth - 1));
            }
        }

        return output.join("\n");
    }

    private formatValue(value: any): string {
        if (value instanceof ASTNode) {
            return this.formatNodeValue(value);
        }

        if (value instanceof ASTContext) {
            return this.formatContextValue(value);
        }

        if (value instanceof Array) {
            return this.formatArrayValue(value);
        }

        if (value instanceof Map) {
            return this.formatMapValue(value);
        }

        if (value instanceof Set) {
            return this.formatSetValue(value);
        }

        if (typeof value === "object") {
            return this.formatObjectValue(value);
        }

        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        return String(value);
    }
}
