import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";
const args = [sample, "--compiler-version", "^0.4.0"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
    let exitCode: number | null;
    let outData = "";
    let errData = "";

    before((done) => {
        const result = SolAstCompileExec(...args);

        outData = result.stdout;
        errData = result.stderr;
        exitCode = result.status;

        done();
    });

    it("Exit code is valid", () => {
        expect(exitCode).toEqual(1);
    });

    it("STDERR is correct", () => {
        expect(errData).toContain(
            'Error: Invalid compiler version "^0.4.0". Possible values: "auto" or exact version string.'
        );
    });

    it("STDOUT is empty", () => {
        expect(outData).toEqual("");
    });
});
