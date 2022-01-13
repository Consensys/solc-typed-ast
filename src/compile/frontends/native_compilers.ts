import os from "os";
import path from "path";
import fse from "fs-extra";
import https from "https";
import { IncomingMessage } from "http";
import { Compiler } from "./base";
import { spawn } from "child_process";

export function getCompilerPrefixForOs(): string | undefined {
    const arch = os.arch();
    const type = os.type();

    // Only 64 bit native compilers built
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

interface CompilerPlatformMetadata {
    builds: VersionListEntry[];
    releases: { [version: string]: string };
}

interface VersionListEntry {
    path: string;
    version: string;
    longVersion: string;
    keccak256: string;
    sha256: string;
    urls: string[];
}

class NativeCompiler extends Compiler {
    constructor(public readonly version: string, public readonly path: string) {
        super(version);
    }

    async compile(inputJSON: any): Promise<any> {
        const child = spawn(this.path, ["--standard-json"], {});
        const resultPromise = function (
            onSuccess: (output: any) => void,
            onError: (e: any) => void
        ) {
            child.stdin.write(JSON.stringify(inputJSON), "utf-8");
            child.stdin.end();
            let stdout = "";
            let stderr = "";

            child.stdout.on("data", (data) => {
                stdout += data;
            });
            child.stderr.on("data", (data) => {
                stderr += data;
            });

            child.on("close", (code) => {
                if (code !== 0) {
                    onError(`Compiler exited with code ${code}. Stderr: ${stderr}`);
                    return;
                }

                if (stderr !== "") {
                    onError(`Compiler exited with non-empty stderr: ${stderr}`);
                    return;
                }

                let outJSON: any;
                try {
                    outJSON = JSON.parse(stdout);
                } catch (e) {
                    onError(e);
                    return;
                }

                onSuccess(outJSON);
            });
        };

        return await new Promise(resultPromise);
    }
}

// TODO: (dimo): This is causing test failures
// TODO: (pavel): We need a more general solution for picking CACHE_DIR
// TODO: The location of the CACHE_DIR should be documented
// TODO: The locaiton of the CACHE_DIR should be settable by the user
const CACHE_DIR = "./.native_compilers_cache/";
const BINARIES_URL = "https://binaries.soliditylang.org";

export async function httpsGet(url: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const fullURL = url;
        https.get(fullURL, (res: IncomingMessage) => {
            const chunks: Buffer[] = [];

            res.on("data", (fragment) => {
                chunks.push(fragment);
            });

            res.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            res.on("error", (e) => reject(e));
        });
    });
}

async function getCompilerMDForPlatform(prefix: string): Promise<CompilerPlatformMetadata> {
    const cachedListPath = path.join(CACHE_DIR, prefix, "list.json");

    if (fse.existsSync(cachedListPath)) {
        return fse.readJSONSync(cachedListPath) as CompilerPlatformMetadata;
    }

    const rawMD = await (await httpsGet(`${BINARIES_URL}/${prefix}/list.json`)).toString();
    const parsedMD = JSON.parse(rawMD) as CompilerPlatformMetadata;

    fse.ensureDirSync(path.join(CACHE_DIR, prefix));
    fse.writeJSONSync(cachedListPath, parsedMD);

    return parsedMD;
}

export async function getNativeCompilerForVersion(
    version: string
): Promise<NativeCompiler | undefined> {
    const prefix = getCompilerPrefixForOs();

    if (prefix === undefined) {
        return undefined;
    }

    const md = await getCompilerMDForPlatform(prefix);

    if (version in md.releases) {
        const compilerFileName = md.releases[version];
        fse.ensureDirSync(path.join(CACHE_DIR, prefix));

        const compilerLocalPath = path.join(CACHE_DIR, prefix, compilerFileName);

        if (!fse.existsSync(compilerLocalPath)) {
            const compiler = await httpsGet(`${BINARIES_URL}/${prefix}/${compilerFileName}`);
            fse.writeFileSync(compilerLocalPath, compiler, { mode: 0o555 });
        }

        return new NativeCompiler(version, compilerLocalPath);
    }
    return undefined;
}
