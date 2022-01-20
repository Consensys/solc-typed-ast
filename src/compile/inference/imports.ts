import fse from "fs-extra";
import { dirname, isAbsolute, join, normalize } from "path";
import { ImportResolver, Remapping } from "..";
import { assert } from "../..";
import { FileLevelNodeKind, parseFileLevelDefinitions } from "./file_level_definitions_parser";

function applyRemappings(remappings: Remapping[], path: string): string {
    for (const [, prefix, mapped_prefix] of remappings) {
        if (path.startsWith(prefix)) {
            return path.replace(prefix, mapped_prefix);
        }
    }

    return path;
}

export function normalizeImportPath(path: string): string {
    const normalized = normalize(path);

    return isAbsolute(normalized) ? normalized : "./" + normalized;
}

function isPathWithRelativePrefix(path: string): boolean {
    return path.startsWith("./") || path.startsWith("../");
}

function computeRealPath(
    importer: string | undefined,
    imported: string,
    remappings: Remapping[]
): string {
    // TODO(dimo): We have to check that the behavior of normalize(join(...)) below
    // matches the behavior described in this section https://docs.soliditylang.org/en/v0.8.8/path-resolution.html#relative-imports
    // and that it works for all compiler versions
    let result = applyRemappings(remappings, imported);

    if (importer !== undefined && isPathWithRelativePrefix(result)) {
        const importingFileDir = dirname(importer);

        result = normalizeImportPath(join(importingFileDir, result));
    }

    return result;
}

export function findAllFiles(
    files: Map<string, string>,
    remappings: Remapping[],
    resolvers: ImportResolver[]
): Map<string, string> {
    const queue: Array<[string | undefined, string]> = [];

    for (const fileName of files.keys()) {
        queue.push([undefined, fileName]);
    }

    const visited = new Set<string>();
    const result = new Map<string, string>();

    while (queue.length > 0) {
        const [importer, imported] = queue.pop() as [string | undefined, string];

        const realPath = computeRealPath(importer, imported, remappings);

        /**
         * Skip already processed imports
         */
        if (visited.has(realPath)) {
            continue;
        }

        let content = files.get(realPath);

        if (content === undefined) {
            for (const resolver of resolvers) {
                const resolvedPath = resolver.resolve(realPath);

                if (resolvedPath !== undefined) {
                    content = fse.readFileSync(resolvedPath, { encoding: "utf-8" });

                    break;
                }
            }

            assert(content !== undefined, 'Couldn\'t find "{0}"', imported);

            result.set(isPathWithRelativePrefix(imported) ? realPath : imported, content);
        }

        visited.add(realPath);

        // TODO: Need to catch the underlying syntax error (if any) and wrap it into a PPAble error
        const flds = parseFileLevelDefinitions(content);

        for (const fld of flds) {
            if (fld.kind === FileLevelNodeKind.Import) {
                queue.push([realPath, fld.path]);
            }
        }
    }

    return result;
}
