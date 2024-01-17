import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/reports/A.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = "//ContractDefinition/@name";
    const args = [sample, "--compiler-kind", kind, "--xpath", selector];
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
            expect(outData).toContain("A");
            expect(outData).toContain("B");
        });
    });
}
