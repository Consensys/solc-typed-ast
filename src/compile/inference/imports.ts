import fse from "fs-extra";
import { dirname, isAbsolute, join, normalize } from "path";
import { CompileInferenceError, ImportResolver, Remapping } from "..";
import {
    AnyFileLevelNode,
    FileLevelNodeKind,
    parseFileLevelDefinitions,
    SyntaxError
} from "./file_level_definitions_parser";

/**
 * Apply the first remapping in `remappings` that fits `path` and
 * return the updated path.
 */
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

/**
 * Check that `path` starts with a relative prefix "." or "./".  Note that we
 * don't use `!path.isAbsolute(path)` on purpose.  Otherwise it might consider
 * paths like `@open-zeppelin/...` as relative.
 */
function isPathWithRelativePrefix(path: string): boolean {
    return path.startsWith("./") || path.startsWith("../");
}

/**
 * Given the `importer` unit path, and the path `imported` of an import directive
 * inside the unit, compute the real path of the imported unit.
 *
 * This takes into account remappings, relative and absolute paths.
 * Note: The returned path is not neccessarily absolute!
 */
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

/**
 * Given a partial map `files` from file names to file contents, a list of
 * `remappings` and a list of `ImportResolver`s `resolvers`, find and return all
 * ADDITIONAL files that are imported from the starting set `files` but are
 * missing in `files`. The return value is also a map from file names to file
 * contents.
 */
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

            if (content === undefined) {
                throw new CompileInferenceError(
                    `Couldn't find ${realPath} imported from ${importer}`
                );
            }

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

                throw new CompileInferenceError(
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
