import expect from "expect";
import {
    ASTNode,
    ASTReader,
    ASTSourceMapComputer,
    ASTWriter,
    compileSol,
    compileSourceString,
    DefaultASTWriterMapping,
    PrettyFormatter,
    SourceUnit
} from "../../../src";

function readAST(fileName: string, version: string, source?: string): SourceUnit[] {
    const reader = new ASTReader();

    const result =
        source === undefined
            ? compileSol(fileName, version, [])
            : compileSourceString(fileName, source, version, []);

    return reader.read(result.data);
}

function writeAST(units: SourceUnit[], version: string): [string, Map<ASTNode, string>] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);
    const fragments = new Map<ASTNode, string>();

    return [units.map((unit) => writer.write(unit, fragments)).join("\n"), fragments];
}

function computeUnitsSourceMap(
    units: SourceUnit[],
    fragments: Map<ASTNode, string>
): Map<ASTNode, [number, number]> {
    const sourceMapComputer = new ASTSourceMapComputer();
    const unitSourceMaps = units.map((unit) => sourceMapComputer.compute(unit, fragments));

    // Merge unit source maps
    return unitSourceMaps.reduce((acc, cur) => {
        for (const key of cur.keys()) {
            if (acc.has(key)) {
                throw new Error(`Key "${key}" is already set in target map`);
            }

            acc.set(key, cur.get(key) as [number, number]);
        }

        return acc;
    }, new Map<ASTNode, [number, number]>());
}

const samples = [
    ["test/samples/solidity/compile_04.sol", "0.4.24"],
    ["test/samples/solidity/compile_05.sol", "0.5.6"],
    ["test/samples/solidity/compile_06.sol", "0.6.1"],
    ["test/samples/solidity/latest_06.sol", "0.6.12"],
    ["test/samples/solidity/latest_07.sol", "0.7.6"]
];

for (const [sample, version] of samples) {
    describe(`Check mappings of ${sample} (version ${version})`, () => {
        const units = readAST(sample, version);
        const [writtenSource] = writeAST(units, version);

        const writtenUnits = readAST(sample, version, writtenSource);
        const [, fragments] = writeAST(writtenUnits, version);

        const sourceMap = computeUnitsSourceMap(writtenUnits, fragments);

        for (const unit of writtenUnits) {
            for (const node of unit.getChildren(true)) {
                const sourceInfo = node.sourceInfo;

                const solcStart = sourceInfo.offset;
                const solcLen = sourceInfo.length;

                const [compStart, compLen] = sourceMap.get(node) as [number, number];

                /**
                 * Skip nodes without written source.
                 * Usually these nodes are empty return `ParameterList`s.
                 */
                if (solcLen === compLen && solcLen === 0) {
                    continue;
                }

                it(`Check ${node.type}#${node.id} (${node.src})`, () => {
                    expect(solcStart + ":" + solcLen).toEqual(compStart + ":" + compLen);
                });
            }
        }
    });
}
