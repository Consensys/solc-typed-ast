import expect from "expect";
import { PossibleCompilerKinds } from "../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const sample = "test/samples/solidity/missing_pragma.sol";

for (const kind of PossibleCompilerKinds) {
    const args = [sample, "--compiler-kind", kind, "--raw"];
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
            const data = JSON.parse(outData);

            expect(data).toBeInstanceOf(Object);
            expect(data.sources).toBeInstanceOf(Object);
            expect(Object.keys(data.sources)).toHaveLength(1);
        });
    });
}
