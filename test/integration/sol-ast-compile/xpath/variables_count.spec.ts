import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { separator, SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/reports/A.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = "count(//VariableDeclaration)";
    const args = [sample, "--compiler-kind", kind, "--xpath", selector];
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
            const parts = outData.split("\n");

            expect(parts[0].endsWith("A.sol")).toEqual(true);
            expect(parts[1]).toEqual(separator);
            expect(parts[2]).toEqual("1");

            expect(parts[3].endsWith("B.sol")).toEqual(true);
            expect(parts[4]).toEqual(separator);
            expect(parts[5]).toEqual("1");
        });
    });
}
