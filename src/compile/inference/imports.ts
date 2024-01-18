import fse from "fs-extra";
import { dirname, normalize } from "path";
import { CompileInferenceError, ImportResolver, Remapping } from "..";
import { FileMap, assert, bytesToString } from "../..";
import {
    AnyFileLevelNode,
    FileLevelNodeKind,
    parseFileLevelDefinitions,
    PeggySyntaxError
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

/**
 * Check that `path` starts with a relative prefix "." or "./".  Note that we
 * don't use `!path.isAbsolute(path)` on purpose.  Otherwise it might consider
 * paths like `@open-zeppelin/...` as relative.
 */
function isPathWithRelativePrefix(path: string): boolean {
    return path.startsWith("./") || path.startsWith("../");
}

/**
 * Normalize a relative import path as described in
 * https://docs.soliditylang.org/en/v0.8.8/path-resolution.html#relative-imports
 *
 * @param importer - source unit name of importing unit
 * @param imported - path of import directive
 */
function normalizeRelativeImportPath(importer: string, imported: string): string {
    imported = normalize(imported);

    const importedSegments = imported.split("/").filter((s) => s !== "");

    let prefix = dirname(importer);
    let strippedSegments = 0;

    while (
        strippedSegments < importedSegments.length &&
        importedSegments[strippedSegments] === ".."
    ) {
        prefix = dirname(prefix);

        strippedSegments++;
    }

    // According to https://docs.soliditylang.org/en/v0.8.8/path-resolution.html#relative-imports when prefix
    // is empty there is no leading "./". However `dirname` always returns non-empty prefixes.
    // Handle this edge case.
    if (prefix === "." && !importer.startsWith(".")) {
        prefix = "";
    }

    assert(prefix === "" || !prefix.endsWith("/"), `Invalid prefix ${prefix}`);

    const suffix = importedSegments.slice(strippedSegments).join("/");

    return prefix === "" ? suffix : prefix + "/" + suffix;
}

/**
 * Given the `importer` source unit path, and the path `imported` of an import
 * directive compute the expected **source unit name** of the imported file.
 * This is the name the compiler will look for in its "VFS" as defined starting
 * here:
 *
 * https://docs.soliditylang.org/en/v0.8.8/path-resolution.html
 *
 * This takes into account relative and absolute paths and remappings.
 */
function computeSourceUnitName(
    importerSourceUnit: string,
    imported: string,
    remappings: Remapping[]
): string {
    if (isPathWithRelativePrefix(imported)) {
        return normalizeRelativeImportPath(importerSourceUnit, imported);
    }

    return applyRemappings(remappings, imported);
}

async function resolveSourceUnitName(
    sourceUnitName: string,
    resolvers: ImportResolver[]
): Promise<[Uint8Array, string] | undefined> {
    for (const resolver of resolvers) {
        const resolvedPath = resolver.resolve(sourceUnitName);

        if (resolvedPath !== undefined) {
            const contents = await fse.readFile(resolvedPath);

            return [contents, resolvedPath];
        }
    }

    return undefined;
}

/**
 * Given a partial map `files` from **source unit names** to file contents, a list of
 * `remappings` and a list of `ImportResolver`s - `resolvers`, find all
 * files that are imported from the starting set `files` but are
 * **missing** in `files` and add them into the `files` map. Also for each imported file
 * add a mapping from its source unit name to the actual file name in `fileNames`.
 */
export async function findAllFiles(
    files: FileMap,
    fileNames: Map<string, string>,
    remappings: Remapping[],
    resolvers: ImportResolver[],
    visited = new Set<string>()
): Promise<void> {
    /**
     * Queue of source unit names to process
     */
    const queue: string[] = [...files.keys()];

    while (queue.length > 0) {
        const sourceUnitName = queue.pop() as string;

        /**
         * Skip already processed units
         */
        if (visited.has(sourceUnitName)) {
            continue;
        }

        visited.add(sourceUnitName);

        let content = files.get(sourceUnitName);

        /**
         * Missing contents - try and fill them in from the resolvers
         */
        if (content === undefined) {
            const result = await resolveSourceUnitName(sourceUnitName, resolvers);

            if (result === undefined) {
                throw new CompileInferenceError(`Couldn't find ${sourceUnitName}`);
            }

            content = result[0];

            files.set(sourceUnitName, content);
            fileNames.set(sourceUnitName, result[1]);
        }

        let flds: AnyFileLevelNode[];

        try {
            flds = parseFileLevelDefinitions(bytesToString(content));
        } catch (e: any) {
            if (e instanceof PeggySyntaxError) {
                const start = e.location.start.offset;
                const end = e.location.end.offset;
                const length = end - start;

                throw new CompileInferenceError(
                    `Failed parsing imports at ${sourceUnitName}:${start}:${length} - ${e.message}`
                );
            }

            throw e;
        }

        for (const fld of flds) {
            if (fld.kind === FileLevelNodeKind.Import) {
                queue.push(computeSourceUnitName(sourceUnitName, fld.path, remappings));
            }
        }
    }
}
