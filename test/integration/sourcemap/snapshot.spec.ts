import expect from "expect";
import fse from "fs-extra";
import {
    ASTNode,
    ASTReader,
    ASTWriter,
    CompilerKind,
    compileSol,
    DefaultASTWriterMapping,
    LatestCompilerVersion,
    PossibleCompilerKinds,
    PrettyFormatter,
    SourceUnit
} from "../../../src";

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

describe("Source map snapshot tests", () => {
    for (const [fileName, sample] of cases) {
        for (const kind of PossibleCompilerKinds) {
            describe(`[${kind}] ${fileName}`, () => {
                let units: SourceUnit[];
                let compilerVersion: string;

                beforeAll(async () => {
                    const reader = new ASTReader();
                    const result = await compileSol(
                        fileName,
                        "auto",
                        {},
                        undefined,
                        undefined,
                        kind as CompilerKind
                    );

                    compilerVersion =
                        result.compilerVersion === undefined
                            ? LatestCompilerVersion
                            : result.compilerVersion;

                    units = reader.read(result.data);

                    expect(units.length).toBeGreaterThan(0);
                });

                it(`Matches expected output sample "${sample}"`, () => {
                    const formatter = new PrettyFormatter(4, 0);
                    const writer = new ASTWriter(
                        DefaultASTWriterMapping,
                        formatter,
                        compilerVersion
                    );

                    const parts: string[] = [];

                    for (const unit of units) {
                        const sourceMap = new Map<ASTNode, [number, number]>();
                        const source = writer.write(unit, sourceMap);

                        parts.push(source);

                        for (const [node, [offset, length]] of sourceMap.entries()) {
                            const nodeStr = node.type + "#" + node.id + " (" + node.src + ")";
                            const coordsStr = offset + ":" + length + ":" + unit.sourceListIndex;

                            parts.push("// " + nodeStr + " -> " + coordsStr);
                        }
                    }

                    const result = parts.join("\n") + "\n";

                    // Uncomment next line to update snapshots
                    // fse.writeFileSync(sample, result, { encoding: "utf-8" });

                    const expectation = fse.readFileSync(sample, { encoding: "utf-8" });

                    expect(result).toEqual(expectation);
                });
            });
        }
    }
});
