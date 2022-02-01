import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const cases = [
    [
        "test/samples/solidity/declarations/interface_060.sol",
        "test/samples/solidity/declarations/interface_060.tree.txt"
    ],
    ["test/samples/solidity/interface_id.sol", "test/samples/solidity/interface_id.tree.txt"],
    [
        "test/samples/solidity/library_fun_overloads.sol",
        "test/samples/solidity/library_fun_overloads.tree.txt"
    ],
    ["test/samples/solidity/fun_selectors.sol", "test/samples/solidity/fun_selectors.tree.txt"]
];

for (const [sample, snapshot] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = [sample, "--compiler-kind", kind, "--tree"];
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
                expect(errData).toEqual("");
            });

            it("STDOUT is correct", () => {
                const snapshotData = fse.readFileSync(snapshot, { encoding: "utf8" });

                expect(outData.replace(process.cwd(), "")).toContain(snapshotData);
            });
        });
    }
}
