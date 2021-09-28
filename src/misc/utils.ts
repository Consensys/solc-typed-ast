import { pp, ppArr, PPIsh } from "..";
import { ASTNode } from "../ast/ast_node";

export function forAll<T>(iterable: Iterable<T>, cb: (v: T) => boolean): boolean {
    for (const el of iterable) {
        if (!cb(el)) {
            return false;
        }
    }

    return true;
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

            let part: string;

            if (detail instanceof ASTNode) {
                part = pp(detail);

                nodes.push(detail);
            } else if (detail instanceof Array) {
                part = ppArr(detail);
            } else {
                part = pp(detail);
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
