import { ASTContext, ASTNode } from "../ast";

export interface PPAble {
    pp(): string;
}

export type PPIsh =
    | PPAble
    | ASTNode
    | ASTContext
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | PPIsh[]
    | Set<PPIsh>
    | Map<PPIsh, PPIsh>
    | Iterable<PPIsh>;

export function isPPAble(value: any): value is PPAble {
    return value ? typeof value.pp === "function" : false;
}

export function pp(value: PPIsh): string {
    if (value instanceof ASTNode) {
        return value.type + " #" + value.id;
    }

    if (value instanceof ASTContext) {
        return value.constructor.name + " #" + value.id;
    }

    if (value === undefined) {
        return "<undefined>";
    }

    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) {
        return String(value);
    }

    if (isPPAble(value)) {
        return value.pp();
    }

    if (value instanceof Array) {
        return ppArr(value);
    }

    if (value instanceof Set) {
        return ppSet(value);
    }

    if (value instanceof Map) {
        return ppMap(value);
    }

    if (typeof value[Symbol.iterator] === "function") {
        return ppIter(value);
    }

    throw new Error("Unhandled value in pp(): " + String(value));
}

export function ppArr(array: PPIsh[], separator = ",", start = "[", end = "]"): string {
    return start + array.map(pp).join(separator) + end;
}

export function ppIter(iter: Iterable<PPIsh>, separator = ",", start = "[", end = "]"): string {
    const parts: string[] = [];

    for (const part of iter) {
        parts.push(pp(part));
    }

    return start + parts.join(separator) + end;
}

export function ppSet(set: Set<PPIsh>, separator = ",", start = "{", end = "}"): string {
    return ppIter(set, separator, start, end);
}

export function ppMap(
    map: Map<PPIsh, PPIsh>,
    separator = ",",
    keyValueSeparator = ":",
    start = "{",
    end = "}"
): string {
    const parts: string[] = [];

    for (const [name, val] of map.entries()) {
        parts.push(pp(name) + keyValueSeparator + pp(val));
    }

    return start + parts.join(separator) + end;
}

export function fmt(message: string, ...details: PPIsh[]): string {
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

    return message;
}
