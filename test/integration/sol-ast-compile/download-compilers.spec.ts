import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const args = ["--download-compilers", "native", "wasm"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
    let exitCode: number | null;
    let outData: string;
    let errData: string;

    beforeAll(() => {
        const result = SolAstCompileExec(...args);

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
        const lines = outData.trimEnd().split("\n");
        const header = lines.shift();

        expect(header).toEqual("Downloading compilers (native, wasm) to current compiler cache:");

        for (const line of lines) {
            expect(line).toMatch(/\((NativeCompiler|WasmCompiler) v\d+\.\d+\.\d+\)$/);
        }
    });
});
