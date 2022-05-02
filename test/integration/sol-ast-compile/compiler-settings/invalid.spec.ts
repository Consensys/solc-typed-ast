import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";
const badArgsSamples: Array<[string[], string]> = [
    [
        [sample, "--compiler-settings", "{blahblah}"],
        `Invalid compiler settings '{blahblah}'. Compiler settings must be a valid JSON object`
    ]
];

for (const [sampleArgs, expectedError] of badArgsSamples) {
    for (const kind of PossibleCompilerKinds) {
        const args = [...sampleArgs, "--compiler-kind", kind];
        const command = SolAstCompileCommand(...args);

        describe(command, () => {
            let exitCode: number | null;
            let outData = "";
            let errData = "";

            before(() => {
                const result = SolAstCompileExec(...args);

                outData = result.stdout;
                errData = result.stderr;
                exitCode = result.status;
            });

            it("Exit code is valid", () => {
                expect(exitCode).toEqual(1);
            });

            it("STDERR is correct", () => {
                expect(errData).toContain(expectedError);
            });

            it("STDOUT is empty", () => {
                expect(outData).toEqual("");
            });
        });
    }
}
