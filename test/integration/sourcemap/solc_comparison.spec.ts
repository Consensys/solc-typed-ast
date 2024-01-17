import expect from "expect";
import {
    ASTNode,
    ASTReader,
    ASTWriter,
    CompilerKind,
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
    PossibleCompilerKinds,
    PrettyFormatter,
    SourceUnit,
    VariableDeclaration
} from "../../../src";

async function readAST(
    fileName: string,
    version: string,
    compilerKind: CompilerKind,
    source?: string
): Promise<SourceUnit[]> {
    const reader = new ASTReader();

    const result = await (source === undefined
        ? compileSol(fileName, version, undefined, undefined, undefined, compilerKind)
        : compileSourceString(
              fileName,
              source,
              version,
              undefined,
              undefined,
              undefined,
              compilerKind
          ));

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
    for (const kind of PossibleCompilerKinds) {
        describe(`Check source mapping of ${sample} (version ${version}, kind ${kind})`, () => {
            let writtenUnits: SourceUnit[];
            let writtenSource: string;
            let sourceMap: Map<ASTNode, [number, number]>;

            beforeAll(async () => {
                const units = await readAST(sample, version, kind as CompilerKind);

                /**
                 * Remove StructuredDoumentation nodes due to unstable behavior,
                 * related to compiler bugs.
                 */
                removeStructuredDocumentationNodes(units);

                [writtenSource] = writeAST(units, version);

                writtenUnits = await readAST(sample, version, kind as CompilerKind, writtenSource);

                [, sourceMap] = writeAST(writtenUnits, version);
            });

            it("Source map from ASTWriter is compatible with source map from Solc", async () => {
                for (const unit of writtenUnits) {
                    for (const node of unit.getChildren(true)) {
                        const sourceInfo = node.sourceInfo;

                        const solcStart = sourceInfo.offset;
                        const solcLen = sourceInfo.length;

                        if (!sourceMap.has(node)) {
                            expect(node.type).toEqual("ParameterList");
                            expect((node as ParameterList).vParameters.length).toEqual(0);

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
        });
    }
}
