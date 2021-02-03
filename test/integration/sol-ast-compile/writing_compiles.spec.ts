import fse from "fs-extra";
import expect from "expect";
import { SolAstCompileExec } from "./common";

// We skip files that have imports (latest_08.sol, c.sol)
const cases: string[] = [
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
    //"test/samples/solidity/latest_08.sol",
    "test/samples/solidity/writer_edge_cases.sol",
    "test/samples/solidity/statements/inline_assembly_060.sol"
    //"test/samples/solidity/meta/complex_imports/c.sol"
];

export type CompiledBytecode = any;
/*
function getBytecode(fileName: string): CompiledBytecode {
    const res = SolAstCompileExec(fileName, "--bin");

    expect(res.status).toEqual(0);

    const output = res.output.filter((x) => x !== null).join("");
    const writtenBytecode = JSON.parse(output);
    return writtenBytecode;
}
*/

for (const fileName of cases) {
    const args = [fileName, "--source"];

    describe(`Check re-written ${fileName} compiles`, () => {
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
            expect(exitCode).toEqual(0);
        });

        it("STDERR is empty", () => {
            expect(errData).toContain("");
        });

        it("Written text compiles", () => {
            fse.writeFileSync("tmp.sol", outData, { encoding: "utf8" });

            const result = SolAstCompileExec("tmp.sol");
            expect(result.status).toEqual(0);
            /*
            TODO: Compare bytecodes
            const originalBytecode = getBytecode(fileName);
            const writtenBytecode = getBytecode("tmp.sol");
            expect(originalBytecode).toEqual(writtenBytecode);
            */
        });
    });
}
