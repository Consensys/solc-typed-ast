import { spawnSync } from "child_process";
import expect from "expect";
import { SolAstCompileCommand } from "./common";

const args = ["--locate-compiler-cache"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
    let exitCode: number | null;
    let outData: string;
    let errData: string;

    beforeAll(() => {
        const env: { [key: string]: string | undefined } = {};

        Object.entries(process.env)
            .filter(([name]) => name !== "SOL_AST_COMPILER_CACHE")
            .forEach(([key, val]) => {
                env[key] = val;
            });

        const result = spawnSync("sol-ast-compile", args, { env, encoding: "utf8" });

        outData = result.stdout;
        errData = result.stderr;
        exitCode = result.status;
    });

    it("Exit code is valid", () => {
        expect(exitCode).toEqual(0);
    });

    it("STDERR is empty", () => {
        expect(errData).toEqual("");
    });

    it("STDOUT is correct", () => {
        expect(outData).toContain(".compiler_cache");
    });
});
