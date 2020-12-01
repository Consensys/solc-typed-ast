import fse from "fs-extra";
import path from "path";

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

export class RemappingResolver extends FileSystemResolver {
    private remapping: Remapping[];

    constructor(remapping: Remapping[]) {
        super();

        this.remapping = remapping;
    }

    resolve(fileName: string): string | undefined {
        const remapped = this.getRemappedPath(fileName, this.remapping);

        return remapped ? super.resolve(remapped) : undefined;
    }

    private getRemappedPath(filePath: string, remapping: Remapping[]): string | undefined {
        for (const [, prefix, replacement] of remapping) {
            if (filePath.startsWith(prefix)) {
                return filePath.replace(prefix, replacement);
            }
        }

        return undefined;
    }
}

export class LocalNpmResolver implements ImportResolver {
    private baseDir: string;

    constructor(baseDir: string) {
        this.baseDir = baseDir;
    }

    resolve(fileName: string): string | undefined {
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
