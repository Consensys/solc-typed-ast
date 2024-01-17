import { spawnSync } from "child_process";
import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileExec } from "../common";

const samples: string[] = [
    "test/samples/solidity/declarations/contract_050.sol",
    "test/samples/solidity/expressions/tuple.sol",
    "test/samples/solidity/expressions/conditional_0413.sol",
    "test/samples/solidity/statements/do_while_050.sol",
    "test/samples/solidity/statements/for_050.sol",
    "test/samples/solidity/statements/while_050.sol",
    "test/samples/solidity/statements/if_0413.sol",
    "test/samples/solidity/statements/variable_declaration_050.sol",
    "test/samples/solidity/statements/variable_declaration_0413.sol",
    "test/samples/solidity/compile_04.sol",
    "test/samples/solidity/compile_05.sol",
    "test/samples/solidity/compile_06.sol",
    "test/samples/solidity/latest_06.sol",
    "test/samples/solidity/latest_07.sol",
    "test/samples/solidity/writer_edge_cases.sol",
    "test/samples/solidity/statements/inline_assembly_060.sol"

    /**
     * Intentionally skip sources with imports:
     */
    //"test/samples/solidity/latest_08.sol",
    //"test/samples/solidity/meta/complex_imports/c.sol"
];

export type CompiledBytecode = any;

for (const fileName of samples) {
    for (const kind of PossibleCompilerKinds) {
        const args = [fileName, "--compiler-kind", kind, "--source"];

        describe(`[${kind}] Check re-written ${fileName} compiles`, () => {
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

            it("Written source compiles", () => {
                const result = spawnSync(
                    "sol-ast-compile",
                    ["--mode", "sol", "--stdin", "--tree", "--compiler-kind", kind],
                    {
                        input: outData,
                        encoding: "utf8"
                    }
                );

                expect(result.status).toEqual(0);
            });
        });
    }
}
