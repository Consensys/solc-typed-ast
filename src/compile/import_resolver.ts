import fse from "fs-extra";
import path from "path";
import { assert } from "../misc";

const findUpSync = require("findup-sync");

export interface ImportResolver {
    resolve(fileName: string): string | undefined;
}

export class FileSystemResolver implements ImportResolver {
    basePath?: string;
    includePaths?: string[];

    constructor(basePath?: string, includePaths?: string[]) {
        this.basePath = basePath;
        this.includePaths = includePaths;
    }

    resolve(fileName: string): string | undefined {
        const prefixes = [this.basePath ? this.basePath : ""].concat(
            this.includePaths ? this.includePaths : []
        );

        for (const prefix of prefixes) {
            const prefixedFileName = prefix ? path.join(prefix, fileName) : fileName;

            if (fse.existsSync(prefixedFileName)) {
                return prefixedFileName;
            }
        }

        return fse.existsSync(fileName) ? fileName : undefined;
    }
}

export type Remapping = [string, string, string];

export class LocalNpmResolver implements ImportResolver {
    basePath?: string;
    inferedRemappings?: Map<string, Remapping>;

    constructor(basePath?: string, inferedRemappings?: Map<string, Remapping>) {
        this.basePath = basePath;
        this.inferedRemappings = inferedRemappings;
    }

    resolve(fileName: string): string | undefined {
        assert(this.basePath !== undefined, "LocalNpmResolver: base path is not set");

        let currentDir = this.basePath;

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
                     * If the normalized paths are starting with
                     * a proper directory name X (not "." or ".."),
                     * then we can infer a remapping from X to "modulesPath/X/"
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
