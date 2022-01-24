import fse from "fs-extra";
import { dirname, isAbsolute, join, normalize } from "path";
import { ImportResolver, Remapping } from "..";
import { assert } from "../..";
import {
    AnyFileLevelNode,
    FileLevelNodeKind,
    parseFileLevelDefinitions,
    SyntaxError
} from "./file_level_definitions_parser";

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

        let flds: AnyFileLevelNode[];

        try {
            flds = parseFileLevelDefinitions(content);
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                const start = e.location.start.offset;
                const end = e.location.end.offset;
                const length = end - start;

                throw new Error(
                    `Failed parsing imports at ${realPath}:${start}:${length} - ${e.message}`
                );
            }

            throw e;
        }

        for (const fld of flds) {
            if (fld.kind === FileLevelNodeKind.Import) {
                queue.push([realPath, fld.path]);
            }
        }
    }

    return result;
}
