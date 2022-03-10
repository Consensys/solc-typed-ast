import axios from "axios";
import fse from "fs-extra";
import os from "os";
import path from "path";
import { assert } from "../../misc/utils";

export function getCompilerPrefixForOs(): string | undefined {
    const arch = os.arch();

    /**
     * Only 64 bit native compilers built
     */
    if (arch !== "x64") {
        return undefined;
    }

    const type = os.type();

    if (type === "Linux") {
        return "linux-amd64";
    }

    if (type === "Windows_NT") {
        return "windows-amd64";
    }

    if (type === "Darwin") {
        return "macosx-amd64";
    }

    return undefined;
}

export interface CompilerPlatformMetadata {
    builds: VersionListEntry[];
    releases: { [version: string]: string };
}

export interface VersionListEntry {
    path: string;
    version: string;
    longVersion: string;
    keccak256: string;
    sha256: string;
    urls: string[];
}

const cacheDirDefault = path.join(__dirname, "..", "..", "..", ".compiler_cache");
const cacheDirCustom = process.env["SOL_AST_COMPILER_CACHE"];

export const CACHE_DIR = cacheDirCustom === undefined ? cacheDirDefault : cacheDirCustom;
export const BINARIES_URL = "https://binaries.soliditylang.org";

/**
 * Return true IFF child is a subdirectory of parent.
 */
export function isSubDir(child: string, parent: string): boolean {
    const relPath = path.relative(parent, child);

    return !path.isAbsolute(relPath) && !relPath.startsWith("..");
}

export function getCachedMDPath(prefix: string): string {
    const listPath = path.join(CACHE_DIR, prefix, "list.json");

    assert(isSubDir(listPath, CACHE_DIR), `Path ${listPath} escapes from cache dir ${CACHE_DIR}`);

    return listPath;
}

export async function downloadCompilerMDForPlatform(
    prefix: string
): Promise<CompilerPlatformMetadata> {
    const cachedListPath = getCachedMDPath(prefix);

    const response = await axios.get<CompilerPlatformMetadata>(
        `${BINARIES_URL}/${prefix}/list.json`
    );

    const metaData = response.data;

    await fse.ensureDir(path.dirname(cachedListPath));
    await fse.writeJSON(cachedListPath, metaData);

    return metaData;
}

export async function getCompilerMDForPlatform(
    prefix: string,
    version: string
): Promise<CompilerPlatformMetadata> {
    const cachedListPath = getCachedMDPath(prefix);

    if (fse.existsSync(cachedListPath)) {
        const md = await fse.readJSON(cachedListPath);

        if (version in md.releases) {
            return md;
        }
    }

    return downloadCompilerMDForPlatform(prefix);
}
