import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const error = "Unable to auto-detect mode by the file name";
const output = ["SourceUnit #2", "ContractDefinition #1", 'name: "Test"', 'kind: "contract"'];

const cases: Array<[string, string, number, string, string[]]> = [
    ["test/samples/solidity/any.sol", "auto", 0, "", output],
    ["test/samples/solidity/any.json", "auto", 0, "", output],
    ["test/samples/solidity/any_sol.any", "auto", 1, error, []],
    ["test/samples/solidity/any_json.any", "auto", 1, error, []],
    ["test/samples/solidity/any.sol", "sol", 0, "", output],
    ["test/samples/solidity/any_sol.any", "sol", 0, "", output],
    ["test/samples/solidity/any.json", "json", 0, "", output],
    ["test/samples/solidity/any_json.any", "json", 0, "", output]
];

for (const [fileName, mode, expectedExitCode, stdErr, stdOut] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = [fileName, "--compiler-kind", kind, "--mode", mode];
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
                expect(exitCode).toEqual(expectedExitCode);
            });

            it("STDERR is correct", () => {
                expect(errData).toContain(stdErr);
            });

            it("STDOUT is correct", () => {
                for (const value of stdOut) {
                    expect(outData).toContain(value);
                }
            });
        });
    }
}
