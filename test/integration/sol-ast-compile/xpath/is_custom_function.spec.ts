import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/latest_06.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = "//*[is(@abstract)]/@id";
    const args = [sample, "--compiler-kind", kind, "--xpath", selector, "--depth", "0"];
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
            const contracts = new Map<string, boolean>([
                ["42", false],
                ["51", false],
                ["76", true],
                ["78", false],
                ["83", false],
                ["521", false],
                ["646", false],
                ["652", false],
                ["663", false]
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
}
