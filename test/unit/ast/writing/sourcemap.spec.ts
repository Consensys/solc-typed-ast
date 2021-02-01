import { assert } from "console";
import {
    ASTNode,
    ASTReader,
    ASTSourceMapComputer,
    ASTWriter,
    CompileResult,
    compileSol,
    compileSourceString,
    DefaultASTWriterMapping,
    PrettyFormatter,
    SourceUnit
} from "../../../../src";

function readAST(
    fileName: string,
    version: string,
    source: string | undefined = undefined
): SourceUnit[] {
    const reader = new ASTReader();
    let compRes: CompileResult;

    if (source === undefined) {
        compRes = compileSol(fileName, version, []);
    } else {
        compRes = compileSourceString(fileName, source, version, []);
    }

    return reader.read(compRes.data);
}

function writeAST(units: SourceUnit[], version: string): [string, Map<ASTNode, string>] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);

    const fragments: Map<ASTNode, string> = new Map();
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
            assert(!acc.has(key));
            acc.set(key, cur.get(key) as [number, number]);
        }
        return acc;
    }, new Map<ASTNode, [number, number]>());
}

describe("Source mappings correct", () => {
    const samples = [
        ["test/samples/solidity/source_map.sol", "0.6.12"],
        ["test/samples/solidity/compile_04.sol", "0.4.24"],
        ["test/samples/solidity/compile_05.sol", "0.5.6"],
        ["test/samples/solidity/compile_06.sol", "0.6.1"],
        ["test/samples/solidity/latest_06.sol", "0.6.12"],
        ["test/samples/solidity/latest_07.sol", "0.7.5"]
    ];
    for (const [file, version] of samples) {
        it(`Check mappings of ${file}`, () => {
            // Read the file

            const units = readAST(file, version);
            const [canonicalSource] = writeAST(units, version);

            const canonUnits = readAST(file, version, canonicalSource);
            const [canonicalSource2, fragments] = writeAST(canonUnits, version);
            const computedSourceMap = computeUnitsSourceMap(canonUnits, fragments);

            const getSlice = (start: number, len: number, str: string) =>
                len < 20 ? str.slice(start, start + len) : str.slice(start, start + 17) + "...";

            // We should be writing the same file
            //expect(canonicalSource2).toEqual(canonicalSource);

            for (const unit of canonUnits) {
                for (const child of unit.getChildren(true)) {
                    const solcRngStart = child.sourceInfo.offset;
                    const solcRngLen = child.sourceInfo.length;

                    const [compRngStart, compRngLen] = computedSourceMap.get(child) as [
                        number,
                        number
                    ];

                    // Its ok for nodes that don't have any text to differ in position. Usually this is ParameterLists
                    if (solcRngLen === compRngLen && solcRngLen === 0) {
                        continue;
                    }

                    if (solcRngLen !== compRngLen || solcRngStart !== compRngStart) {
                        const solcSample = getSlice(solcRngStart, solcRngLen, canonicalSource);
                        const compSample = getSlice(compRngStart, compRngLen, canonicalSource2);

                        console.log(
                            `${child.constructor.name}#${child.id} original SRCMap: ${
                                child.src
                            }(${solcSample}) computed: ${computedSourceMap.get(
                                child
                            )} ${compSample} prevSibling: ${
                                child.previousSibling?.constructor.name
                            }#${child.previousSibling?.id} ${
                                child.previousSibling !== undefined
                                    ? fragments.get(child.previousSibling)
                                    : undefined
                            }`
                        );
                        assert(false);
                    }
                }
            }
        });
    }
});
