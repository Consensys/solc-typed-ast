import expect from "expect";
import fse from "fs-extra";
import { SolAstCompileCommand, SolAstCompileExec } from "./common";

const sample = "test/samples/solidity/meta/imports/A.sol";
const args = [sample, "--raw", "--with-sources"];
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
        const data = JSON.parse(outData);

        expect(data).toBeInstanceOf(Object);
        expect(data.sources).toBeInstanceOf(Object);

        const entries: Iterable<[string, any]> = Object.entries(data.sources);
        const options = { encoding: "utf-8" };

        for (const [key, entry] of entries) {
            expect(entry.source).toEqual(fse.readFileSync(key, options));
        }
    });
});
