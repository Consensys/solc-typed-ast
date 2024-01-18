import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const sample = "test/samples/solidity/meta/imports/A.sol";

for (const kind of PossibleCompilerKinds) {
    const args = [sample, "--compiler-kind", kind, "--raw", "--with-sources"];
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

            const entries: Iterable<[string, any]> = Object.entries(data.sources);

            for (const [key, entry] of entries) {
                expect(entry.source).toEqual(fse.readFileSync(key, "utf-8"));
            }
        });
    });
}
