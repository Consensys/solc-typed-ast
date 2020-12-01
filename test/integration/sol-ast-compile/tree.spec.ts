import expect from "expect";
import fse from "fs-extra";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const sample = "test/samples/solidity/declarations/interface_060.sol";
const snapshot = "test/samples/solidity/declarations/interface_060.tree.txt";
const args = [sample, "--tree"];
const command = SolAstCompileCommand(...args);

describe(command, () => {
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
        expect(errData).toEqual("");
    });

    it("STDOUT is correct", () => {
        const snapshotData = fse.readFileSync(snapshot, { encoding: "utf8" });

        expect(outData.replace(process.cwd(), "")).toContain(snapshotData);
    });
});
