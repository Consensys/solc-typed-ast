import { spawnSync, SpawnSyncReturns } from "child_process";

export function SolAstCompileCommand(...params: string[]): string {
    let command = "sol-ast-compile";

    if (params.length) {
        command += " " + params.join(" ");
    }

    return command;
}

export function SolAstCompileExec(...params: string[]): SpawnSyncReturns<string> {
    return spawnSync("sol-ast-compile", params, { encoding: "utf8" });
}

export const separator = "-".repeat(60);

export const options = [
    "version",
    "solidity-versions",
    "stdin",
    "mode",
    "compiler-version",
    "compiler-kind",
    "path-remapping",
    "base-path",
    "include-path",
    "compiler-settings",
    "raw",
    "with-sources",
    "tree",
    "source",
    "xpath",
    "depth",
    "locate-compiler-cache",
    "download-compilers",
    "help"
];
