import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const cases: Array<[string, string, string, string | undefined]> = [
    [
        "test/samples/solidity/declarations/contract_050.sol",
        "test/samples/solidity/declarations/contract_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/expressions/tuple.sol",
        "test/samples/solidity/expressions/tuple_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/expressions/conditional_0413.sol",
        "test/samples/solidity/expressions/conditional_0413.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/do_while_050.sol",
        "test/samples/solidity/statements/do_while_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/for_050.sol",
        "test/samples/solidity/statements/for_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/while_050.sol",
        "test/samples/solidity/statements/while_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/if_0413.sol",
        "test/samples/solidity/statements/if_0413.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/variable_declaration_050.sol",
        "test/samples/solidity/statements/variable_declaration_050.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/variable_declaration_0413.sol",
        "test/samples/solidity/statements/variable_declaration_0413.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/compile_04.sol",
        "test/samples/solidity/compile_04.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/compile_05.sol",
        "test/samples/solidity/compile_05.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/compile_06.sol",
        "test/samples/solidity/compile_06.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/latest_06.sol",
        "test/samples/solidity/latest_06.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/latest_07.sol",
        "test/samples/solidity/latest_07.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/latest_08.sol",
        "test/samples/solidity/latest_08.sourced.sol",
        "auto",
        '{ "viaIR": true }'
    ],
    [
        "test/samples/solidity/writer_edge_cases.sol",
        "test/samples/solidity/writer_edge_cases.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/statements/inline_assembly_060.sol",
        "test/samples/solidity/statements/inline_assembly_060.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/meta/complex_imports/c.sol",
        "test/samples/solidity/meta/complex_imports/c.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/struct_docs_04.sol",
        "test/samples/solidity/struct_docs_04.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/struct_docs_05.sol",
        "test/samples/solidity/struct_docs_05.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/dispatch_05.json",
        "test/samples/solidity/dispatch_05.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/dispatch_05.json",
        "test/samples/solidity/dispatch_05.sourced.sol",
        "0.5.17",
        undefined
    ],
    [
        "test/samples/solidity/spdx/sample00.sol",
        "test/samples/solidity/spdx/sample00.sourced.sol",
        "auto",
        undefined
    ],
    [
        "test/samples/solidity/spdx/sample01.sol",
        "test/samples/solidity/spdx/sample01.sourced.sol",
        "auto",
        undefined
    ]
];

for (const [fileName, sample, compilerVersion, compilerSettings] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = [
            fileName,
            "--compiler-kind",
            kind,
            "--compiler-version",
            compilerVersion,
            "--source"
        ];

        if (compilerSettings !== undefined) {
            args.push("--compiler-settings", compilerSettings);
        }

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
                expect(errData).toContain("");
            });

            it("STDOUT is correct", () => {
                const result = outData.replace(new RegExp(process.cwd(), "g"), "");

                // Uncomment next line to update snapshots
                // fse.writeFileSync(sample, result, { encoding: "utf-8" });

                const expected = fse.readFileSync(sample, { encoding: "utf-8" });

                expect(result).toEqual(expected);
            });
        });
    }
}
