import expect from "expect";
import fse from "fs-extra";
import { PossibleCompilerKinds } from "../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const cases: Array<[string[], string]> = [
    [
        ["test/samples/solidity/declarations/interface_060.sol"],
        "test/samples/solidity/declarations/interface_060.tree.txt"
    ],
    [["test/samples/solidity/interface_id.sol"], "test/samples/solidity/interface_id.tree.txt"],
    [
        ["test/samples/solidity/library_fun_overloads.sol"],
        "test/samples/solidity/library_fun_overloads.tree.txt"
    ],
    [["test/samples/solidity/fun_selectors.sol"], "test/samples/solidity/fun_selectors.tree.txt"],
    [
        ["test/samples/solidity/multifile/A.sol", "test/samples/solidity/multifile/B.sol"],
        "test/samples/solidity/multifile/A_B.tree.txt"
    ],
    [
        ["test/samples/solidity/multifile/A.sol", "test/samples/solidity/multifile/C.sol"],
        "test/samples/solidity/multifile/A_C.tree.txt"
    ],
    [
        [
            "test/samples/solidity/multifile/A.sol",
            "test/samples/solidity/multifile/B.sol",
            "test/samples/solidity/multifile/C.sol"
        ],
        "test/samples/solidity/multifile/A_B_C.tree.txt"
    ]
];

for (const [samples, snapshot] of cases) {
    for (const kind of PossibleCompilerKinds) {
        const args = [...samples, "--compiler-kind", kind, "--tree"];
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
                const result = outData.replace(new RegExp(process.cwd(), "g"), "");

                // Uncomment next line to update snapshots
                // fse.writeFileSync(snapshot, result, { encoding: "utf-8" });

                expect(result).toContain(snapshotData);
            });
        });
    }
}
