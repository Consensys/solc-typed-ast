import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";

for (const kind of PossibleCompilerKinds) {
    const args = [sample, "--compiler-kind", kind, "--compiler-version", "^0.4.0"];
    const command = SolAstCompileCommand(...args);

    describe(command, () => {
        let exitCode: number | null;
        let outData = "";
        let errData = "";

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
                'Invalid compiler version "^0.4.0". Possible values: "auto" or exact version string.'
            );
        });

        it("STDOUT is empty", () => {
            expect(outData).toEqual("");
        });
    });
}
