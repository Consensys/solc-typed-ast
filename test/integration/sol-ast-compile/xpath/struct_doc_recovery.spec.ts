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
            const cases: Array<[string, string]> = [
                ["X\\nY\\nZ", "4:38:0"],
                ["C", "114:6:0"],
                ["A", "151:6:0"],
                ["B", "213:20:0"],
                ["A\\nB", "264:16:0"],
                ["B", "320:20:0"],
                ["C", "487:6:0"],
                ["A", "511:6:0"],
                ["B", "561:20:0"],
                ["A\\nB", "600:16:0"],
                ["B", "644:20:0"],
                ["C", "775:6:0"],
                ["A", "817:6:0"],
                ["B", "884:20:0"],
                ["A\\nB", "940:16:0"],
                ["B", "1001:20:0"],
                ["goose", "1209:12:0"],
                ["comment", "1236:14:0"],
                ["this is a docstring", "1312:26:0"],
                ["this is also a docstring", "1411:32:0"]
            ];

            for (const [src, text] of cases) {
                const sample = `"${src}"\n"${text}"`;

                expect(outData).toContain(sample);
            }
        });
    });
}
