import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/latest_06.sol";
const selector = "//*[is(@abstract)]/@id";
const args = [sample, "--xpath", selector, "--depth", "0"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
    let exitCode: number | null;
    let outData: string;
    let errData: string;

    before((done) => {
        const result = SolAstCompileExec(...args);

        outData = result.stdout;
        errData = result.stderr;
        exitCode = result.status;

        done();
    });

    it("Exit code is valid", () => {
        expect(exitCode).toEqual(0);
    });

    it("STDERR is empty", () => {
        expect(errData).toEqual("");
    });

    it("STDOUT is correct", () => {
        const contracts = new Map<number, boolean>([
            [42, false],
            [51, false],
            [76, true],
            [78, false],
            [83, false],
            [521, false],
            [646, false]
        ]);

        for (const [id, occurance] of contracts.entries()) {
            if (occurance) {
                expect(outData).toContain(id);
            } else {
                expect(outData).not.toContain(id);
            }
        }
    });
});
