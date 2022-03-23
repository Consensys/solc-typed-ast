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

    constructor(baseDir?: string) {
        this.baseDir = baseDir;
    }

    resolve(fileName: string): string | undefined {
        assert(this.baseDir !== undefined, "LocalNpmResolver: base directory is not set");

        let currentDir = this.baseDir;

        while (true) {
            const modulesPath = findUpSync("node_modules/", { cwd: currentDir });

            if (modulesPath === null) {
                break;
            }

            const modulePath = path.join(modulesPath, fileName);

            if (fse.existsSync(modulePath)) {
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
