import expect from "expect";
import { LatestAndFirstVersionInEachSeriesStrategy, PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/missing_pragma.sol";
const versions = new LatestAndFirstVersionInEachSeriesStrategy(false).select();

const values = [
    "SourceUnit #5",
    'src: "0:38:0"',

    "ContractDefinition #4",
    'src: "0:37:0"',
    'name: "Test"',

    "VariableDeclaration #3",
    'src: "20:14:0"',
    'name: "some"',
    'typeString: "uint8"',

    "ElementaryTypeName #1",
    'src: "20:5:0"',
    'name: "uint8"',

    "Literal #2",
    'src: "33:1:0"',
    'value: "1"'
];

for (const version of versions) {
    for (const kind of PossibleCompilerKinds) {
        const args = [sample, "--compiler-kind", kind, "--compiler-version", version];
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
                for (const value of values) {
                    expect(outData).toContain(value);
                }
            });
        });
    }
}
