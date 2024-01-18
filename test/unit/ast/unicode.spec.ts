import expect from "expect";
import fse from "fs-extra";
import {
    ASTKind,
    ASTReader,
    ASTWriter,
    DefaultASTWriterMapping,
    FileMap,
    FunctionTypeName,
    ParameterList,
    PrettyFormatter,
    SourceUnit,
    SrcRangeMap,
    StructuredDocumentation,
    assert,
    bytesToString,
    compileSol,
    compileSourceString,
    detectCompileErrors,
    stringToBytes
} from "../../../src";

const samples: string[] = [
    "./test/samples/solidity/unicode.sol",
    "./test/samples/solidity/unicode_big.sol"
];

async function strToAst(
    name: string,
    contents: string,
    version: string
): Promise<[SourceUnit, ASTReader]> {
    const sources: FileMap = new Map([[name, stringToBytes(contents)]]);
    const canonicalResult = await compileSourceString(name, contents, version);

    const errors = detectCompileErrors(canonicalResult.data);
    assert(errors.length === 0, `Unexpected errors when compiling ${name}`);

    const reader = new ASTReader();
    const units = reader.read(canonicalResult.data, ASTKind.Modern, sources);

    assert(units.length === 1, `Expected a single unit in ${name}`);

    return [units[0], reader];
}

function writeUnit(unit: SourceUnit, version: string): [string, SrcRangeMap] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);

    const srcMap: SrcRangeMap = new Map();
    return [writer.write(unit, srcMap), srcMap];
}

describe("Unicode tests", () => {
    for (const sample of samples) {
        describe(sample, () => {
            let unit: SourceUnit;
            let reader: ASTReader;
            let version: string;
            let contents: Uint8Array;
            let sources: FileMap;

            beforeAll(async () => {
                contents = fse.readFileSync(sample);
                sources = new Map([[sample, contents]]);

                const result = await compileSol(sample, "auto");

                const errors = detectCompileErrors(result.data);
                expect(errors).toHaveLength(0);

                reader = new ASTReader();
                const units = reader.read(result.data, ASTKind.Modern, sources);

                expect(units).toHaveLength(1);

                unit = units[0];

                version = result.compilerVersion as string;
            });

            it("StructuredDocumentation source locations are computed correctly", () => {
                const docs = [...unit.getChildrenByType(StructuredDocumentation)];

                for (const doc of docs) {
                    const coords = doc.sourceInfo;
                    const actual = bytesToString(
                        contents.slice(coords.offset, coords.offset + coords.length)
                    ).trim();

                    // The actual fragment should start with a comment
                    expect(actual.startsWith("/*") || actual.startsWith("/")).toBeTruthy();

                    // The actual fragment should be well terminated for block comments
                    if (actual.startsWith("/*")) {
                        expect(actual.endsWith("*/")).toBeTruthy();
                    }

                    // The actual fragment contains the text of the node
                    // We need to check that the actual range in the file includes each line
                    // of the computed text of the StructuredDocumentation. We do this line by line
                    // since for block comments the .text doesnt include the * at the start of each line
                    for (const line of doc.text.split("\n")) {
                        expect(actual.includes(line)).toBeTruthy();
                    }
                }
            });

            it("Writer produces correct source maps", async () => {
                const [canonicalContents] = writeUnit(unit, version);
                const [canonicalUnit, canonicalReader] = await strToAst(
                    sample,
                    canonicalContents,
                    version
                );

                const [newContents, newContentsSrcMap] = writeUnit(canonicalUnit, version);

                const [newUnit] = await strToAst(sample, newContents, version);

                for (const newNode of newUnit.getChildren(true)) {
                    if (
                        newNode instanceof ParameterList ||
                        newNode instanceof StructuredDocumentation
                    ) {
                        continue;
                    }

                    const oldNode = canonicalReader.context.locate(newNode.id);

                    assert(oldNode !== undefined, `No old node for id ${newNode.id} ${newNode}`);

                    assert(
                        oldNode.constructor.name === newNode.constructor.name,
                        `Mismatch between {0} and {1}`,
                        oldNode,
                        newNode
                    );

                    const writerSrc = newContentsSrcMap.get(oldNode);

                    assert(writerSrc !== undefined, `Missing writer src for {0}`, oldNode);

                    const readSrc = newNode.sourceInfo;

                    expect(writerSrc[0]).toEqual(readSrc.offset);

                    if (Math.abs(writerSrc[1] - readSrc.length) > 1) {
                        // The solidity compiler erroneously includes the variable name in the source map
                        // TODO: We should file a solidity bug
                        if (newNode instanceof FunctionTypeName) {
                            continue;
                        }
                    }

                    // The length may be off by 1 since we may be a little inaccurate in source maps w.r.t ;
                    expect(Math.abs(writerSrc[1] - readSrc.length)).toBeLessThanOrEqual(1);
                }
            });
        });
    }
});
