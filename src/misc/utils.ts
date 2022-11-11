import { pp, PPIsh } from "..";
import { ASTNode } from "../ast/ast_node";

export function forAll<T>(iterable: Iterable<T>, cb: (v: T) => boolean): boolean {
    for (const el of iterable) {
        if (!cb(el)) {
            return false;
        }
    }

    return true;
}

export function forAny<T>(iterable: Iterable<T>, cb: (v: T) => boolean): boolean {
    for (const el of iterable) {
        if (cb(el)) {
            return true;
        }
    }

    return false;
}

export function assert(
    condition: boolean,
    message: string,
    ...details: PPIsh[]
): asserts condition {
    if (condition) {
        return;
    }

    if (details.length) {
        const nodes: ASTNode[] = [];

        for (let i = 0; i < details.length; i++) {
            const detail = details[i];
            const part = pp(detail);

            if (detail instanceof ASTNode) {
                nodes.push(detail);
            }

            message = message.replace(new RegExp("\\{" + i + "\\}", "g"), part);
        }

        if (nodes.length) {
            if (!message.endsWith(".")) {
                message += ".";
            }

            message += "\n\n" + nodes.map((node) => node.print()).join("\n");
        }
    }

    throw new Error(message);
}

/**
 * Recursively search all values in an object or array.
 * @param obj Object to search recursively
 * @param matchKey Key an object must have to be matched
 * @param cb Callback function to check objects with a matching key.
 * If no callback provided, collects all properties at `matchKey` anywhere in the tree.
 * If callback returns `true` for `node`, `node[matchKey]` is collected.
 * If callback returns anything else, returned value is collected.
 * @param onlyFirst Whether to stop after first located element
 */
export function deepFindIn(
    obj: any,
    matchKey: string | number,
    cb?: (o: any) => any,
    onlyFirst?: boolean
): any[] {
    const result: any[] = [];
    for (const key of Object.getOwnPropertyNames(obj)) {
        const value = obj[key];
        if (key === matchKey) {
            if (!cb) result.push(value);
            else {
                const ret = cb(obj);
                if (ret || typeof ret === "number") {
                    result.push(typeof ret === "boolean" ? value : ret);
                }
            }
        } else if (value && typeof value === "object") {
            result.push(...deepFindIn(value, matchKey, cb));
        }
        if (onlyFirst && result.length) break;
    }
    return result;
}
