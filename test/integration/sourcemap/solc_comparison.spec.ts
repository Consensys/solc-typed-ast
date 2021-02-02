import expect from "expect";
import {
    ASTNode,
    ASTReader,
    ASTSourceMapComputer,
    ASTWriter,
    compileSol,
    compileSourceString,
    ContractDefinition,
    DefaultASTWriterMapping,
    EventDefinition,
    FunctionDefinition,
    ModifierDefinition,
    PrettyFormatter,
    SourceUnit,
    VariableDeclaration
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

function removeStructuredDocumentationNodes(units: SourceUnit[]): void {
    for (const unit of units) {
        unit.walk((node) => {
            if (
                node instanceof ContractDefinition ||
                node instanceof EventDefinition ||
                node instanceof FunctionDefinition ||
                node instanceof ModifierDefinition ||
                node instanceof VariableDeclaration
            ) {
                node.documentation = undefined;
            }
        });
    }
}

function getSourceFragment(offset: number, length: number, source: string): string {
    return source.slice(offset, offset + length);
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

        /**
         * Remove StructuredDoumentation nodes due to unstable behavior,
         * related to compiler bugs.
         */
        removeStructuredDocumentationNodes(units);

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

                const solcCoords = solcStart + ":" + solcLen;
                const compCoords = compStart + ":" + compLen;

                const solcFragment = getSourceFragment(solcStart, solcLen, writtenSource);
                const compFragment = getSourceFragment(compStart, compLen, writtenSource);

                it(`Coordinates of ${node.type}#${node.id} are valid`, () => {
                    if (compFragment !== solcFragment || compFragment !== solcFragment) {
                        console.log(`------ Solc ------ [${solcCoords}]`);
                        console.log(solcFragment);
                        console.log(`---- Computed ---- [${compCoords}]`);
                        console.log(compFragment);
                        console.log("------------------");
                    }

                    expect(compCoords).toEqual(solcCoords);
                    expect(compFragment).toEqual(solcFragment);
                });
            }
        }
    });
}
