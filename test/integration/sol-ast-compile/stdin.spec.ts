import { spawnSync } from "child_process";
import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../src";
import { SolAstCompileCommand } from "./common";

const error =
    'Mode "auto" is not supported for the input from STDIN. Explicitly specify "mode" as "sol" or "json" instead.';

const output = ["SourceUnit #2", "ContractDefinition #1", 'name: "Test"', 'kind: "contract"'];

const cases: Array<[string, string, number, string, string[]]> = [
    ["test/samples/solidity/any.sol", "auto", 1, error, []],
    ["test/samples/solidity/any.sol", "sol", 0, "", output],
    ["test/samples/solidity/any.json", "json", 0, "", output]
];

for (const [fileName, mode, expectedExitCode, stdErr, stdOut] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = ["--compiler-kind", kind, "--stdin", "--mode", mode];
        const command = SolAstCompileCommand(...args) + " < " + fileName;

        describe(command, () => {
            let exitCode: number | null;
            let outData: string;
            let errData: string;

            beforeAll(() => {
                const result = spawnSync("sol-ast-compile", args, {
                    input: fse.readFileSync(fileName),
                    encoding: "utf8"
                });

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
