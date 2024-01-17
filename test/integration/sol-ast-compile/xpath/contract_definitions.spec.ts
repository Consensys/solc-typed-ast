import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/reports/A.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = "//ContractDefinition";
    const args = [sample, "--compiler-kind", kind, "--xpath", selector, "--depth", "0"];
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
            expect(outData).toContain("ContractDefinition #8");
            expect(outData).toContain("id: 8");
            expect(outData).toContain('src: "45:33:0"');
            expect(outData).toContain('type: "ContractDefinition"');
            expect(outData).toContain('name: "A"');
            expect(outData).toContain("vScope: SourceUnit #9");
            expect(outData).toContain("linearizedBaseContracts: Array(2) [ 8, 14 ]");

            expect(outData).toContain("ContractDefinition #14");
            expect(outData).toContain("id: 14");
            expect(outData).toContain('src: "27:28:1"');
            expect(outData).toContain('type: "ContractDefinition"');
            expect(outData).toContain('name: "B"');
            expect(outData).toContain("vScope: SourceUnit #15");
            expect(outData).toContain("linearizedBaseContracts: Array(1) [ 14 ]");

            expect(outData).not.toContain("id: 3");
            expect(outData).not.toContain("id: 7");
            expect(outData).not.toContain("id: 13");
        });
    });
}
