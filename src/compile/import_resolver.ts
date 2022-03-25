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
    inferedRemappings?: Map<string, Remapping>;

    constructor(baseDir?: string, inferedRemappings?: Map<string, Remapping>) {
        this.baseDir = baseDir;
        this.inferedRemappings = inferedRemappings;
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
                if (this.inferedRemappings) {
                    const [prefix] = normalizedFileName.split("/");

                    /**
                     * If the normalized paths begins with a proper directory name X (not "." or ".."),
                     * then we can infer a remapping from X to modulesPath/X/
                     */
                    if (prefix && prefix !== "." && prefix !== "..") {
                        const remapping: Remapping = ["", prefix, path.join(modulesPath, prefix)];

                        this.inferedRemappings.set(fileName, remapping);
                    }
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
