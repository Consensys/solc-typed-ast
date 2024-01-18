import expect from "expect";
import fse from "fs-extra";
import {
    compileJson,
    CompilerKind,
    detectCompileErrors,
    FileMap,
    getCompilerForVersion,
    LatestAndFirstVersionInEachSeriesStrategy,
    LatestCompilerVersion,
    NativeCompiler,
    parsePathRemapping,
    stringToBytes,
    WasmCompiler
} from "../../../src";

describe("Compile general utils", () => {
    describe("getCompilerForVersion()", () => {
        it("Non-exact version of compiler triggers an error", async () => {
            expect.assertions(1);

            try {
                await getCompilerForVersion("^0.5.0", CompilerKind.WASM);
            } catch (e: any) {
                expect(e.message).toMatch(
                    "Version string must contain exact SemVer-formatted version without any operators"
                );
            }
        });

        it("Unsupported version of compiler triggers an error", async () => {
            expect.assertions(1);

            try {
                await getCompilerForVersion("0.4.10", CompilerKind.WASM);
            } catch (e: any) {
                expect(e.message).toMatch("");
            }
        });

        const strategy = new LatestAndFirstVersionInEachSeriesStrategy();

        for (const version of strategy.select()) {
            it(`Compiler ${version} is accessible`, async () => {
                expect(await getCompilerForVersion(version, CompilerKind.WASM)).toBeInstanceOf(
                    WasmCompiler
                );

                expect(await getCompilerForVersion(version, CompilerKind.Native)).toBeInstanceOf(
                    NativeCompiler
                );
            });
        }
    });

    describe("parsePathRemapping()", () => {
        const cases: Array<[string, [string, string, string]]> = [
            ["context:prefix=replace", ["context", "prefix", "replace"]],
            ["prefix=replace", ["", "prefix", "replace"]]
        ];

        for (const [remapping, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${remapping}"`, () => {
                const [parsed] = parsePathRemapping([remapping]);

                expect(parsed).toEqual(result);
            });
        }

        it(`Invalid input triggers an error`, () => {
            expect(() => parsePathRemapping(["???"])).toThrow();
        });
    });

    describe("detectCompileErrors()", () => {
        const cases: Array<[string, string[]]> = [
            [
                "test/samples/solidity/error_0413.json",
                ["ParserError: Expected token Semicolon got 'RBrace'\n}\n^\n"]
            ],
            [
                "test/samples/solidity/error_050.json",
                ["ParserError: Expected ';' but got '}'\n}\n^\n"]
            ]
        ];

        for (const [fileName, expectedErrors] of cases) {
            it(`Detects ${JSON.stringify(expectedErrors)} in "${fileName}"`, () => {
                const data = fse.readJSONSync(fileName);
                const errors = detectCompileErrors(data);

                expect(errors).toHaveLength(expectedErrors.length);

                errors.forEach((error, index) => {
                    expect(error.endsWith(expectedErrors[index])).toEqual(true);
                });
            });
        }
    });

    describe("compileJson()", () => {
        const expectedFiles: FileMap = new Map([
            [
                "./test/sol_files/json_code/B.sol",
                stringToBytes("import './A.sol';\n\ncontract B {\n    int16 test;\n}\n")
            ],
            [
                "./test/sol_files/json_code/A.sol",
                stringToBytes("contract A {\n    uint8 test;\n}\n")
            ]
        ]);

        const cases: Array<[string, string | undefined, RegExp | undefined]> = [
            [
                "test/samples/json/invalid.json",
                undefined,
                /^Unable to find required properties in "[^"]+"$/
            ],
            [
                "test/samples/json/code_empty.json",
                undefined,
                /^Unable to process data structure: neither consistent AST or code values are present$/
            ],
            ["test/samples/json/code_no_main.json", LatestCompilerVersion, undefined],
            ["test/samples/json/code_and_ast.json", undefined, undefined],
            ["test/samples/json/code_main_source.json", LatestCompilerVersion, undefined],
            ["test/samples/json/code_main_in_sources.json", LatestCompilerVersion, undefined]
        ];

        for (const [fileName, version, result] of cases) {
            if (result instanceof RegExp) {
                it(`Throws an error for ${JSON.stringify(fileName)}`, async () => {
                    expect.assertions(1);

                    try {
                        await compileJson(fileName, "auto");
                    } catch (e: any) {
                        expect(e.message).toMatch(result);
                    }
                });
            } else {
                it(`Compiles ${JSON.stringify(fileName)} successfully`, async () => {
                    const { data, compilerVersion, files } = await compileJson(fileName, "auto");

                    expect(data.sources).toBeDefined();
                    expect(detectCompileErrors(data)).toHaveLength(0);

                    expect(compilerVersion).toEqual(version);
                    expect(files).toEqual(expectedFiles);
                });
            }
        }
    });
});
