import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const sample = "test/samples/solidity/reports/A.sol";

for (const kind of PossibleCompilerKinds) {
    const selector = '//ContractDefinition[@name="A"]//VariableDeclaration';
    const args = [sample, "--compiler-kind", kind, "--xpath", selector, "--depth", "100"];
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
            expect(outData).toContain("VariableDeclaration #7");
            expect(outData).toContain("id: 7");
            expect(outData).toContain('src: "64:10:0"');
            expect(outData).toContain('type: "VariableDeclaration"');
            expect(outData).toContain('name: "a"');

            expect(outData).toContain("ElementaryTypeName #5");
            expect(outData).toContain("id: 5");
            expect(outData).toContain('src: "64:4:0"');
            expect(outData).toContain('type: "ElementaryTypeName"');
            expect(outData).toContain('typeString: "uint256"');
            expect(outData).toContain("constant: false");

            expect(outData).toContain("Literal #6");
            expect(outData).toContain("id: 6");
            expect(outData).toContain('src: "73:1:0"');
            expect(outData).toContain('kind: "number"');
            expect(outData).toContain('value: "1"');
        });
    });
}
