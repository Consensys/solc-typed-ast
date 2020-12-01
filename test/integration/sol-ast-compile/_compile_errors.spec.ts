import expect from "expect";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const cases: Array<[string, string[]]> = [
    [
        "test/samples/solidity/error_0413.json",
        [
            "Compile errors encountered:",
            "Unknown compiler:",
            "ParserError: Expected token Semicolon got 'RBrace'"
        ]
    ],
    [
        "test/samples/solidity/error_050.json",
        [
            "Compile errors encountered:",
            "Unknown compiler:",
            "ParserError: Expected ';' but got '}'"
        ]
    ],
    [
        "test/samples/solidity/error_060.json",
        [
            "Compile errors encountered:",
            "Unknown compiler:",
            "ParserError: Expected ';' but got '}'"
        ]
    ]
];

for (const [fileName, stdErr] of cases) {
    const args = [fileName];
    const command = SolAstCompileCommand(...args);

    describe(command, () => {
        let exitCode: number | null;
        let outData: string;
        let errData: string;

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
            for (const value of stdErr) {
                expect(errData).toContain(value);
            }
        });

        it("STDOUT is empty", () => {
            expect(outData).toEqual("");
        });
    });
}
