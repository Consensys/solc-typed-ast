import semver from "semver";

const rx = {
    comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    pragmaSolidity: /pragma solidity\s+([^;]+);/g,

    space: /\s+/g,
    operator: /([^\d.*]+)/g,
    spaceDash: /( -)/g,

    fixed: /^=?\d+\.\d+\.\d+$/,
    exact: /^\d+.\d+.\d+$/
};

export function isFixed(version: string): boolean {
    return rx.fixed.test(version);
}

export function isFloating(version: string): boolean {
    return !isFixed(version);
}

export function isExact(version: string): boolean {
    return rx.exact.test(version);
}

export function getCompilerVersionsBySpecifiers(
    specifiers: string[],
    versions: string[]
): string[] {
    let supported = versions;

    for (const specifier of specifiers) {
        const compatible: string[] = [];

        for (const version of supported) {
            if (semver.satisfies(version, specifier) && !compatible.includes(version)) {
                compatible.push(version);
            }
        }

        supported = compatible;
    }

    return supported;
}

function trimAny(input: string, chars: string[] | string): string {
    let start = 0;
    let end = input.length;

    while (start < end && chars.indexOf(input[start]) >= 0) ++start;

    while (end > start && chars.indexOf(input[end - 1]) >= 0) --end;

    return start > 0 || end < input.length ? input.substring(start, end) : input;
}

export function normalizeSpecifier(specifier: string): string {
    return trimAny(specifier, "\"'")
        .replace(rx.space, "")
        .replace(rx.operator, " $1")
        .replace(rx.spaceDash, "$1 ")
        .trimStart();
}

export function extractSpecifiersFromSource(source: string): string[] {
    const specifiers = [];

    source = source.replace(rx.comments, "");

    let match = rx.pragmaSolidity.exec(source);

    while (match) {
        const specifier = normalizeSpecifier(match[1]);

        specifiers.push(specifier);

        match = rx.pragmaSolidity.exec(source);
    }

    return specifiers;
}
