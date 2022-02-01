import expect from "expect";
import { options, SolAstCompileCommand, SolAstCompileExec } from "./common";

const args = ["--help"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
    let exitCode: number | null;
    let outData: string;
    let errData: string;

    before(() => {
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
        expect(outData).toContain("$ sol-ast-compile <filename>");
        expect(outData.match(/--[^\s]+/g)).toEqual(options.map((option) => "--" + option));
    });
});
