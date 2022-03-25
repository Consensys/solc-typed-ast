import fse from "fs-extra";
import path from "path";
import { assert } from "../misc";

const findUpSync = require("findup-sync");

export interface ImportResolver {
    resolve(fileName: string): string | undefined;
}

export class FileSystemResolver implements ImportResolver {
    resolve(fileName: string): string | undefined {
        return fse.existsSync(fileName) ? fileName : undefined;
    }
}

export type Remapping = [string, string, string];

export class LocalNpmResolver implements ImportResolver {
    baseDir?: string;
    /// Array of all remappings that were "inferred" by the npm resolver
    private _inferedRemappings: Remapping[];

    constructor(baseDir?: string) {
        this.baseDir = baseDir;
        this._inferedRemappings = [];
    }

    get inferredRemappings(): Remapping[] {
        return this._inferedRemappings;
    }

    resolve(fileName: string): string | undefined {
        assert(this.baseDir !== undefined, "LocalNpmResolver: base directory is not set");

        let currentDir = this.baseDir;

        const normalizedFileName = path.normalize(fileName);
        while (true) {
            const modulesPath = findUpSync("node_modules/", { cwd: currentDir });

            if (modulesPath === null) {
                break;
            }

            const modulePath = path.join(modulesPath, normalizedFileName);

            if (fse.existsSync(modulePath)) {
                const parts = normalizedFileName.split("/");

                /// If the normalized paths begins with a proper directory name X (not . or ..),
                /// Then we can infer a remapping from X to modulesPath/X/
                if (
                    parts.length > 0 &&
                    parts[0] !== "." &&
                    parts[0] !== ".." &&
                    parts[0].length > 0
                ) {
                    this._inferedRemappings.push(["", parts[0], path.join(modulesPath, parts[0])]);
                }

                return modulePath;
            }

            const oldDir = currentDir;

            currentDir = path.join(currentDir, "..");

            if (oldDir === currentDir) {
                break;
            }
        }

        return undefined;
    }
}
