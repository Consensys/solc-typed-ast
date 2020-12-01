import expect from "expect";
import fse from "fs-extra";
import {
    ASTContext,
    ASTNodeFactory,
    ASTReader,
    compileJson,
    detectCompileErrors
} from "../../../src";

const cases: Array<[string, string]> = [
    [
        "./test/samples/solidity/declarations/contract_050.json",
        "./test/samples/solidity/declarations/contract_050.nodes.txt"
    ]
];

describe(`ASTNodeFactory.copy() validation`, () => {
    for (const [sample, snapshot] of cases) {
        describe(`Validate copy of ${sample} by snapshot ${snapshot}`, () => {
            let data: any = {};

            before("Compile", () => {
                const result = compileJson(sample, "auto", []);
                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                data = result.data;
            });

            it("Validate copying results", () => {
                const context = new ASTContext();
                const reader = new ASTReader(context);

                const units = reader.read(data);

                const factory = new ASTNodeFactory(context);

                const clones = units.map((unit) => factory.copy(unit));
                const result = clones.map((unit) => unit.print(Number.MAX_SAFE_INTEGER)).join("\n");
                const content = fse.readFileSync(snapshot, { encoding: "utf-8" });

                expect(result).toEqual(content);
            });
        });
    }
});
