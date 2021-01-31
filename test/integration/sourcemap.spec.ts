import expect from "expect";
import fse from "fs-extra";
import {
    ASTNode,
    ASTReader,
    ASTSourceMapComputer,
    ASTWriter,
    compileSol,
    DefaultASTWriterMapping,
    LatestCompilerVersion,
    PrettyFormatter,
    SourceUnit
} from "../../src";

const cases: Array<[string, string]> = [
    [
        "test/samples/solidity/looks_same_075.sol",
        "test/samples/solidity/looks_same_075.sourced.sm.sol"
    ],
    [
        "test/samples/solidity/latest_06.sourced.sol",
        "test/samples/solidity/latest_06.sourced.sm.sol"
    ]
];

describe("SourceMapComputer", () => {
    for (const [fileName, sample] of cases) {
        describe(fileName, () => {
            let units: SourceUnit[];
            let compilerVersion: string;

            before(() => {
                const reader = new ASTReader();
                const result = compileSol(fileName, "auto", []);

                compilerVersion =
                    result.compilerVersion === undefined
                        ? LatestCompilerVersion
                        : result.compilerVersion;

                units = reader.read(result.data);

                expect(units.length).toBeGreaterThan(0);
            });

            it(`Verified by sample ${sample}`, () => {
                const sourceMapComputer = new ASTSourceMapComputer();
                const formatter = new PrettyFormatter(4, 0);
                const writer = new ASTWriter(DefaultASTWriterMapping, formatter, compilerVersion);

                const parts = [];

                for (const unit of units) {
                    const fragments = new Map<ASTNode, string>();
                    const source = writer.write(unit, fragments);
                    const sourceMap = sourceMapComputer.compute(unit, fragments);

                    parts.push(source);

                    for (const [node, [offset, length]] of sourceMap.entries()) {
                        const nodeStr = node.type + "#" + node.id + " (" + node.src + ")";
                        const coordsStr = offset + ":" + length + ":" + unit.sourceListIndex;

                        parts.push("// " + nodeStr + " -> " + coordsStr);
                    }
                }

                const result = parts.join("\n") + "\n";
                const expectation = fse.readFileSync(sample, { encoding: "utf-8" });

                expect(result).toEqual(expectation);
            });
        });
    }
});
