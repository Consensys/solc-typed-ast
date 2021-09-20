import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";
const badArgsSamples = [
    [
        [sample, "--compiler-settings", "{blahblah}"],
        `Error: Invalid compiler settings '{blahblah}'. Compiler settings must be a valid JSON object.`
    ]
];

for (const [args, expectedError] of badArgsSamples) {
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
            expect(errData).toContain(expectedError);
        });

        it("STDOUT is empty", () => {
            expect(outData).toEqual("");
        });
    });
}
