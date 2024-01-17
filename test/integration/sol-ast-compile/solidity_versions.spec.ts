import expect from "expect";
import { CompilerVersions, LatestCompilerVersion } from "../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const args = ["--solidity-versions"];
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

    it(`STDOUT is correct`, () => {
        for (const version of CompilerVersions) {
            expect(outData).toContain(version);
        }

        expect(outData).toContain("Latest supported version: " + LatestCompilerVersion);
    });
});
