import { spawn } from "child_process";
import axios from "axios";
import * as stream from "stream";
import { promisify } from "util";
import { SolcInput } from "../input";
import { Compiler } from "./compiler";
import {
    BINARIES_URL,
    CACHE_DIR,
    getCompilerMDForPlatform,
    getCompilerPrefixForOs,
    isSubDir
} from "./md";
import fse from "fs-extra";
import path from "path";
import { assert } from "../../misc/utils";

class NativeCompiler extends Compiler {
    constructor(public readonly version: string, public readonly path: string) {
        super(version);
    }

    async compile(inputJson: SolcInput): Promise<any> {
        const child = spawn(this.path, ["--standard-json"], {});

        return new Promise((resolve, reject) => {
            child.stdin.write(JSON.stringify(inputJson), "utf-8");
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
                    reject(`Compiler exited with code ${code}, stderr: ${stderr}`);
                    return;
                }

                if (stderr !== "") {
                    reject(`Compiler exited with non-empty stderr: ${stderr}`);
                    return;
                }

                let outJson: any;

                try {
                    outJson = JSON.parse(stdout);
                } catch (e) {
                    reject(e);
                    return;
                }

                resolve(outJson);
            });
        });
    }
}

export async function getNativeCompilerForVersion(
    version: string
): Promise<NativeCompiler | undefined> {
    const prefix = getCompilerPrefixForOs();

    if (prefix === undefined) {
        return undefined;
    }

    const md = await getCompilerMDForPlatform(prefix);
    const compilerFileName = md.releases[version];

    if (compilerFileName === undefined) {
        return undefined;
    }

    const compilerLocalPath = path.join(CACHE_DIR, prefix, compilerFileName);
    assert(
        isSubDir(compilerLocalPath, CACHE_DIR),
        `Path ${compilerLocalPath} escapes from cache dir ${CACHE_DIR}`
    );

    if (!fse.existsSync(compilerLocalPath)) {
        const response = await axios({
            method: "GET",
            url: `${BINARIES_URL}/${prefix}/${compilerFileName}`,
            responseType: "stream"
        });

        const target = fse.createWriteStream(compilerLocalPath, { mode: 0o555 });
        const pipeline = promisify(stream.pipeline);

        await pipeline(response.data, target);
    }

    return new NativeCompiler(version, compilerLocalPath);
}
