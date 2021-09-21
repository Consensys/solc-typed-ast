import os from "os";
import path from "path";
import fse from "fs-extra";
import https from "https";
import { IncomingMessage } from "http";

export function getCompilerPrefixForOs(): string | undefined {
    const arch = os.arch();
    const type = os.type();

    // Only 64 bit native compilers biult
    if (arch !== "x64" && arch !== "ia64") {
        return undefined;
    }

    if (type === "Linux") {
        return "linux-amd64";
    }

    if (type === "Windows_NT") {
        return "windows-amd64";
    }

    if (type === "Darwin") {
        return "windows-amd64";
    }

    return undefined;
}

export type VersionListEntry = {
    path: string;
    version: string;
    longVersion: string;
    keccak256: string;
    sha256: string;
    urls: string[];
};

class NativeCompiler {}

const CACHE_DIR = "./.native_compilers_cache/";
const BINARIES_URL = "binaries.soliditylang.org";

export function httpsGetSync(url: string): string {
    let data: any;

    console.error(`url: ${url}`);
    const listReq = https.request(
        {
            hostname: BINARIES_URL,
            port: 443,
            path: url,
            method: "GET"
        },
        (res: IncomingMessage) => {
            console.error(res.statusCode);
            res.on("data", (d) => {
                console.error(`Got data: ${d}`);
                data = d;
            });
        }
    );

    listReq.on("error", (e) => {
        console.error(`Got error: ${e}`);
        throw new Error(`Failed getting ${url}: ${e}`);
    });

    console.error(`about to end ${listReq}`);
    listReq.end();
    console.error(`end`);
    return data;
}

function getListForCompiler(prefix: string): VersionListEntry[] {
    const cachedListPath = path.join(CACHE_DIR, prefix, "list.json");

    if (fse.existsSync(cachedListPath)) {
        return fse.readJSONSync(cachedListPath).builds as VersionListEntry[];
    }

    const remoteList = httpsGetSync(`/${prefix}/list.json`);
    console.log(remoteList);

    return JSON.parse(remoteList);
}

export function getNativeCompilerForVersion(): NativeCompiler | undefined {
    const prefix = getCompilerPrefixForOs();

    if (prefix === undefined) {
        return undefined;
    }

    getListForCompiler(prefix);

    return undefined;
}
