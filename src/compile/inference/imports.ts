import { ImportResolver, Remapping } from "..";
import {
    parseTopLevelDefinitions,
    TLImportDirective,
    TopLevelNode,
    TopLevelNodeKind
} from "./top_level_definitions_parser";
import fse from "fs-extra";
import { dirname, normalize, join } from "path";

function applyRemappings(remappings: Remapping[], path: string): string {
    for (const [, prefix, mapped_prefix] of remappings) {
        if (path.startsWith(prefix)) {
            return path.replace(prefix, mapped_prefix);
        }
    }

    return path;
}

export function findAllFiles(
    files: Map<string, string>,
    remappings: Remapping[],
    resolvers: ImportResolver[]
): Map<string, string> {
    const queue: string[] = [...files.keys()];
    const visited = new Set<string>();

    const additionalFiles = new Map<string, string>();

    while (queue.length > 0) {
        const filePath = queue.pop() as string;

        // Already processed
        if (visited.has(filePath)) {
            continue;
        }

        let contents = files.get(filePath);

        if (contents === undefined) {
            for (const resolver of resolvers) {
                const resolvedPath = resolver.resolve(filePath);

                if (resolvedPath !== undefined) {
                    contents = fse.readFileSync(resolvedPath, {}).toString();
                    break;
                }
            }

            if (contents === undefined) {
                throw new Error(`Couldn't find ${filePath}`);
            }

            additionalFiles.set(filePath, contents);
        }

        visited.add(filePath);
        // TODO: Need to catch the underlying syntax error (if any) and warp it into a PPAble error
        const tlds: Array<TopLevelNode<any>> = parseTopLevelDefinitions(contents);

        const imports = tlds.filter(
            (tld) => tld.kind === TopLevelNodeKind.Import
        ) as TLImportDirective[];

        for (const imp of imports) {
            const path = imp.path;
            if (path.startsWith("./") || path.startsWith("../")) {
                const importingFileDir = dirname(filePath);
                queue.push(normalize(join(importingFileDir, path)));
            } else {
                queue.push(applyRemappings(remappings, path));
            }
        }
    }

    return additionalFiles;
}
