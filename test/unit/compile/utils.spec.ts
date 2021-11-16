import expect from "expect";
import fse from "fs-extra";
import {
    compileJson,
    createFileSystemImportFinder,
    createMemoryImportFinder,
    detectCompileErrors,
    getWasmCompilerForVersion,
    LatestAndFirstVersionInEachSeriesStrategy,
    LatestCompilerVersion,
    parsePathRemapping
} from "../../../src";

describe("Compile general utils", () => {
    describe("getWasmCompilerForVersion()", () => {
        it("Non-exact version of compiler triggers an error", () => {
            expect(() => getWasmCompilerForVersion("^0.5.0")).toThrow();
        });

        it("Unsupported version of compiler triggers an error", () => {
            expect(() => getWasmCompilerForVersion("0.4.10")).toThrow();
        });

        const strategy = new LatestAndFirstVersionInEachSeriesStrategy();

        for (const version of strategy.select()) {
            it(`Compiler ${version} is accessible`, () => {
                expect(getWasmCompilerForVersion(version)).toBeInstanceOf(Object);
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

    describe("createFileSystemImportFinder()", () => {
        const files = new Map<string, string>();
        const finder = createFileSystemImportFinder(
            "test/samples/solidity/node.sol",
            files,
            parsePathRemapping(["@x/=test/samples/solidity/"])
        );

        const cases = [
            ["test/samples/solidity/node.sol", "pragma solidity"],
            ["@x/missing_pragma.sol", "contract Test"],
            [".bin/tsc", "#!/usr/bin/env"]
        ];

        for (const [fileName, contentPrefix] of cases) {
            it(`Created finder resolves "${fileName}"`, () => {
                const result = finder(fileName) as { contents: string };

                expect(result.contents).toBeDefined();
                expect(result.contents.startsWith(contentPrefix)).toEqual(true);

                const cacheValue = files.get(fileName) as string;

                expect(cacheValue).toBeDefined();
                expect(cacheValue.startsWith(contentPrefix)).toEqual(true);
            });
        }

        it('Created finder not resolves "missing"', () => {
            const result = finder("missing") as { error: string };

            expect(result.error).toBeDefined();
            expect(result.error).toMatch(/^Unable to find import path "[^"]+"$/);
        });
    });

    describe("createMemoryImportFinder()", () => {
        const storage: any = {
            "a/b.sol": {
                source: "test"
            },
            "c.sol": {}
        };

        const files = new Map<string, string>();
        const finder = createMemoryImportFinder(storage, files);

        it(`Created finder resolves "a/b.sol"`, () => {
            const result = finder("a/b.sol") as { contents: string };

            expect(result.contents).toBeDefined();
            expect(result.contents).toEqual("test");

            const cacheValue = files.get("a/b.sol") as string;

            expect(cacheValue).toBeDefined();
            expect(cacheValue).toEqual("test");
        });

        it('Created finder not resolves "c.sol"', () => {
            const result = finder("c.sol") as { error: string };

            expect(result.error).toBeDefined();
            expect(result.error).toMatch(/^Entry at "[^"]+" contains no "source" property$/);
        });

        it('Created finder not resolves "missing"', () => {
            const result = finder("missing") as { error: string };

            expect(result.error).toBeDefined();
            expect(result.error).toMatch(/^Import path "[^"]+" not found in storage$/);
        });

        it("Creation of finder fails for null or undefined", () => {
            expect(() => createMemoryImportFinder(undefined as any, new Map())).toThrow();
            expect(() => createMemoryImportFinder(null as any, new Map())).toThrow();
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
        const expectedFiles = new Map([
            [
                "./test/sol_files/json_code/B.sol",
                "import './A.sol';\n\ncontract B {\n    int16 test;\n}\n"
            ],
            ["./test/sol_files/json_code/A.sol", "contract A {\n    uint8 test;\n}\n"]
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
            [
                "test/samples/json/code_no_main.json",
                undefined,
                /^Unable to detect main source to compile$/
            ],
            [
                "test/samples/json/code_main_source_invalid.json",
                undefined,
                /^Unable to detect main source to compile$/
            ],
            ["test/samples/json/code_and_ast.json", undefined, undefined],
            ["test/samples/json/code_main_source.json", LatestCompilerVersion, undefined],
            ["test/samples/json/code_main_in_sources.json", LatestCompilerVersion, undefined]
        ];

        for (const [fileName, version, result] of cases) {
            if (result instanceof RegExp) {
                it(`Throws an error for ${JSON.stringify(fileName)}`, async () => {
                    try {
                        await compileJson(fileName, "auto", []);
                        expect(false).toBe(true);
                    } catch (e: any) {
                        expect(e.message).toMatch(result);
                    }
                });
            } else {
                it(`Compiles ${JSON.stringify(fileName)} successfully`, async () => {
                    const { data, compilerVersion, files } = await compileJson(
                        fileName,
                        "auto",
                        []
                    );

                    expect(data.sources).toBeDefined();
                    expect(detectCompileErrors(data)).toHaveLength(0);

                    expect(compilerVersion).toEqual(version);
                    expect(files).toEqual(expectedFiles);
                });
            }
        }
    });
});
