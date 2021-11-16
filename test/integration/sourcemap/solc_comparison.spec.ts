import expect from "expect";
import {
    ASTNode,
    ASTReader,
    ASTWriter,
    compileSol,
    compileSourceString,
    ContractDefinition,
    DefaultASTWriterMapping,
    ElementaryTypeName,
    ElementaryTypeNameExpression,
    EventDefinition,
    FunctionDefinition,
    FunctionTypeName,
    ModifierDefinition,
    ParameterList,
    PrettyFormatter,
    SourceUnit,
    VariableDeclaration
} from "../../../src";

async function readAST(fileName: string, version: string, source?: string): Promise<SourceUnit[]> {
    const reader = new ASTReader();

    const result =
        source === undefined
            ? await compileSol(fileName, version, [])
            : await compileSourceString(fileName, source, version, []);

    return reader.read(result.data);
}

function writeAST(units: SourceUnit[], version: string): [string, Map<ASTNode, [number, number]>] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);
    const sourceMap = new Map<ASTNode, [number, number]>();

    return [units.map((unit) => writer.write(unit, sourceMap)).join("\n"), sourceMap];
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
    ["test/samples/solidity/latest_07_no_unicode.sol", "0.7.6"]
];

for (const [sample, version] of samples) {
    describe(`Check mappings of ${sample} (version ${version})`, async () => {
        const units = await readAST(sample, version);

        /**
         * Remove StructuredDoumentation nodes due to unstable behavior,
         * related to compiler bugs.
         */
        removeStructuredDocumentationNodes(units);

        const [writtenSource] = writeAST(units, version);

        const writtenUnits = await readAST(sample, version, writtenSource);
        const [, sourceMap] = writeAST(writtenUnits, version);

        for (const unit of writtenUnits) {
            for (const node of unit.getChildren(true)) {
                const sourceInfo = node.sourceInfo;

                const solcStart = sourceInfo.offset;
                const solcLen = sourceInfo.length;

                if (!sourceMap.has(node)) {
                    it(`Missing node ${node.type}#${node.id} must be an empty parameter list`, () => {
                        expect(node.type).toEqual("ParameterList");
                        expect((node as ParameterList).vParameters.length).toEqual(0);
                    });

                    continue;
                }

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

                if (compFragment === solcFragment && compCoords === solcCoords) {
                    continue;
                }

                /**
                 * Known edge cases where we differ from solc
                 *
                 * Edge-case with typecast to `address payable`
                 */
                if (
                    (node instanceof ElementaryTypeNameExpression ||
                        node instanceof ElementaryTypeName) &&
                    compFragment === "payable" &&
                    solcFragment === "payable("
                ) {
                    continue;
                }

                /**
                 * Edge-case with function typenames
                 */
                if (node instanceof FunctionTypeName) {
                    continue;
                }

                console.log(`------ Solc ------ [${solcCoords}]`);
                console.log(solcFragment);
                console.log(`---- Computed ---- [${compCoords}]`);
                console.log(compFragment);
                console.log("------------------");

                expect(compCoords).toEqual(solcCoords);
                expect(compFragment).toEqual(solcFragment);
            }
        }
    });
}
