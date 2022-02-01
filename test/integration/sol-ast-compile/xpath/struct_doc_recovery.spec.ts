import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/struct_doc_recovery.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = '//StructuredDocumentation/@*[name()="src" or name()="text"]';
    const args = [
        sample,
        "--compiler-kind",
        kind,
        "--compiler-version",
        "0.4.24",
        "--xpath",
        selector
    ];

    const command = SolAstCompileCommand(...args);

    describe(command, () => {
        let exitCode: number | null;
        let outData: string;
        let errData: string;

        before(() => {
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
            const cases: Array<[string, string]> = [
                ["X\\nY\\nZ", "4:37:0"],
                ["C", "85:5:0"],
                ["A", "122:5:0"],
                ["B", "184:20:0"],
                ["A\\nB", "235:15:0"],
                ["B", "291:20:0"],
                ["C", "458:5:0"],
                ["A", "482:5:0"],
                ["B", "532:20:0"],
                ["A\\nB", "571:15:0"],
                ["B", "615:20:0"],
                ["C", "746:5:0"],
                ["A", "788:5:0"],
                ["B", "855:20:0"],
                ["A\\nB", "911:15:0"],
                ["B", "972:20:0"]
            ];

            for (const [src, text] of cases) {
                const sample = `"${src}"\n"${text}"`;

                expect(outData).toContain(sample);
            }
        });
    });
}
