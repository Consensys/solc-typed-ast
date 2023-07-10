import {
    encodeFunctionSignature as abiEncFun,
    encodeEventSignature as abiEncEv
} from "web3-eth-abi";
import { FunctionKind } from "./constants";

export type SourceLocation = { offset: number; length: number; sourceIndex: number };

/**
 * Splits the string using the separator.
 * If the string contains well formed parenthesized expressions
 * then those expression will not be split even if they contain separators.
 *
 * E.g. if we call `split("a,b,c(d,e)", ",", "(", ")")` we will get `["a", "b", "c(d,e)"]`.
 *
 * @param string       String to split
 * @param separator    Separator to use to split the string
 * @param openBrace    String to consider to be an "opening brace"
 * @param closeBrace   String to consider to be a "closing brace"
 *
 * @returns Return the parts into which s has been split.
 */
export function split(
    string: string,
    separator: string,
    openBrace: string,
    closeBrace: string
): string[] {
    const result: string[] = [];

    let current = "";
    let index = 0;
    let depth = 0;

    while (index < string.length) {
        if (depth === 0 && string.startsWith(separator, index)) {
            result.push(current);

            current = "";

            index += separator.length;
        } else {
            let addStr = "";

            if (string.startsWith(openBrace, index)) {
                depth++;

                addStr = openBrace;
            } else if (string.startsWith(closeBrace, index)) {
                depth--;

                if (depth < 0) {
                    throw new Error(`Mismatched braces in string "${string}"`);
                }

                addStr = closeBrace;
            } else {
                addStr = string.slice(index, index + 1);
            }

            current += addStr;
            index += addStr.length;
        }
    }

    if (depth !== 0) {
        throw new Error(`Mismatched braces in string "${string}"`);
    }

    result.push(current);

    return result;
}

export function encodeFuncSignature(signature: string, hexPrefix = false): string {
    const selector = abiEncFun(signature);

    return hexPrefix ? selector : selector.slice(2);
}

export function encodeEventSignature(signature: string, hexPrefix = false): string {
    const selector = abiEncEv(signature);

    return hexPrefix ? selector : selector.slice(2);
}

export function* sequence(start = 0, step = 1): Generator<number, number, number> {
    while (true) {
        yield (start += step);
    }
}

export function parseSourceLocation(range: string): SourceLocation {
    const parts = range.split(":");

    const offset = parseInt(parts[0], 10);
    const length = parseInt(parts[1], 10);
    const sourceIndex = parseInt(parts[2], 10);

    return { offset, length, sourceIndex };
}

export function detectFunctionKind(attributes: any): FunctionKind {
    if (attributes.kind) {
        return attributes.kind;
    }

    if (attributes.isConstructor) {
        return FunctionKind.Constructor;
    }

    return attributes.name === "" ? FunctionKind.Fallback : FunctionKind.Function;
}
