import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";
const args = [sample, "--compiler-settings", "{blahblah}"];
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
        expect(exitCode).toEqual(1);
    });

    it("STDERR is correct", () => {
        expect(errData).toContain(
            "Invalid compiler settings '{blahblah}'. Compiler settings must be a valid JSON object"
        );
    });

    it("STDOUT is empty", () => {
        expect(outData).toEqual("");
    });
});
