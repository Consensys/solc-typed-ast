import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const cases: Array<[string, string]> = [
    [
        "test/samples/solidity/declarations/contract_050.sol",
        "test/samples/solidity/declarations/contract_050.sourced.sol"
    ],
    [
        "test/samples/solidity/expressions/tuple.sol",
        "test/samples/solidity/expressions/tuple_050.sourced.sol"
    ],
    [
        "test/samples/solidity/expressions/conditional_0413.sol",
        "test/samples/solidity/expressions/conditional_0413.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/do_while_050.sol",
        "test/samples/solidity/statements/do_while_050.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/for_050.sol",
        "test/samples/solidity/statements/for_050.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/while_050.sol",
        "test/samples/solidity/statements/while_050.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/if_0413.sol",
        "test/samples/solidity/statements/if_0413.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/variable_declaration_050.sol",
        "test/samples/solidity/statements/variable_declaration_050.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/variable_declaration_0413.sol",
        "test/samples/solidity/statements/variable_declaration_0413.sourced.sol"
    ],
    ["test/samples/solidity/compile_04.sol", "test/samples/solidity/compile_04.sourced.sol"],
    ["test/samples/solidity/compile_05.sol", "test/samples/solidity/compile_05.sourced.sol"],
    ["test/samples/solidity/compile_06.sol", "test/samples/solidity/compile_06.sourced.sol"],
    ["test/samples/solidity/latest_06.sol", "test/samples/solidity/latest_06.sourced.sol"],
    ["test/samples/solidity/latest_07.sol", "test/samples/solidity/latest_07.sourced.sol"],
    ["test/samples/solidity/latest_08.sol", "test/samples/solidity/latest_08.sourced.sol"],
    [
        "test/samples/solidity/writer_edge_cases.sol",
        "test/samples/solidity/writer_edge_cases.sourced.sol"
    ],
    [
        "test/samples/solidity/statements/inline_assembly_060.sol",
        "test/samples/solidity/statements/inline_assembly_060.sourced.sol"
    ],
    [
        "test/samples/solidity/meta/complex_imports/c.sol",
        "test/samples/solidity/meta/complex_imports/c.sourced.sol"
    ],
    [
        "test/samples/solidity/struct_docs_04.sol",
        "test/samples/solidity/struct_docs_04.sourced.sol"
    ],
    ["test/samples/solidity/struct_docs_05.sol", "test/samples/solidity/struct_docs_05.sourced.sol"]
];

for (const [fileName, sample] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = [fileName, "--compiler-kind", kind, "--source"];
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
                expect(errData).toContain("");
            });

            it("STDOUT is correct", () => {
                const content = fse.readFileSync(sample, { encoding: "utf-8" });

                expect(outData.replace(new RegExp(process.cwd(), "g"), "")).toEqual(content);
            });
        });
    }
}
