import expect from "expect";
import fse from "fs-extra";
import {
    CompilationOutput,
    CompileFailedError,
    CompileResult,
    CompilerKind,
    compileSol,
    LatestVersionInEachSeriesStrategy,
    VersionDetectionStrategy
} from "../../../src";
import { searchRecursive } from "../../utils";

/**
 * Invoke `cb` for all `Objects` in `json`.
 */
function walkObjects(json: any, cb: (o: Record<string, any>) => void): void {
    if (json instanceof Array) {
        for (const el of json) {
            walkObjects(el, cb);
        }
    } else if (json instanceof Object) {
        cb(json);

        for (const field of Object.values(json)) {
            walkObjects(field, cb);
        }
    }
}

/**
 * Given a `CompileResult` or `CompileFailedError` normalize it to something
 * that we can use for comparison. For `CompileResult` we just normalize the
 * ASTs for all files a little (see comments below), and for
 * `CompileFailedError` we return just the message.
 */
function normalizeOutput(output: CompileResult | CompileFailedError): any {
    if (output instanceof CompileFailedError) {
        return output.message;
    }

    const sources = output.data.sources;
    const res: any = {
        compilerVersion: output.compilerVersion,
        sources: {}
    };

    // 1) Normalize native AST output for 0.4.x to wasm's
    for (const file in sources) {
        const fileAST = sources[file];

        if ("ast" in fileAST && "legacyAST" in fileAST) {
            /// 0.4.x native output
            res.sources[file] = { AST: fileAST["legacyAST"] };
        } else if ("AST" in fileAST) {
            /// 0.4.x wasm output or >= 0.5.x native/wasm output
            res.sources[file] = fileAST;
        }
    }

    /**
     * 2) In 0.8.x wasm outputs negative
     * referencedDeclaration(s)/overloadedDeclarations as negative, while native
     * casts them to uint. So wasm would output -1, while native would output
     * 4294967295. Normalize to native.
     *
     * 3) The src fields of entries inside the `externalReferences` array of
     * `InlineAssembly` nodes differ between native and wasm. Ignore those for now (set to "")
     *
     * 4) The order of the `externalReferences` in `InlineAssembly` nodes differs sometimes
     * between native and wasm (no idea why)
     */
    walkObjects(res.sources, (n) => {
        const refDecl = n["referencedDeclaration"];

        if (refDecl !== undefined && typeof refDecl === "number" && refDecl < 0) {
            n["referencedDeclaration"] += 4294967296;
        }

        const overlDecls = n["overloadedDeclarations"];
        if (overlDecls instanceof Array) {
            for (let i = 0; i < overlDecls.length; i++) {
                if (overlDecls[i] < 0) {
                    overlDecls[i] += 4294967296;
                }
            }
        }

        if (
            n.name === "InlineAssembly" &&
            n.attributes instanceof Object &&
            n.attributes.externalReferences instanceof Array
        ) {
            walkObjects(n.attributes.externalReferences, (n) => {
                if ("src" in n) {
                    n.src = "";
                }
            });

            n.attributes.externalReferences.sort((a: any, b: any) => {
                const aStr = JSON.stringify(a);
                const bStr = JSON.stringify(b);

                return aStr < bStr ? -1 : aStr === bStr ? 0 : 1;
            });
        }
    });

    return res;
}

describe(`Native and WASM compilers produce the same results for all files`, () => {
    const samples = searchRecursive(
        "test/samples/solidity/",
        (name) => name.endsWith(".sol") && !name.endsWith(".sourced.sol")
    );

    // const skipSamples: string[] = [];

    const defaultCompilationOutput = [CompilationOutput.ALL];
    const defaultCompilerSettings = { optimizer: { enabled: false } };

    const additionalArgs = new Map<string, [string[], CompilationOutput[], any]>([
        [
            "test/samples/solidity/path_remapping/entry.sol",
            [["@missing=./local"], defaultCompilationOutput, defaultCompilerSettings]
        ]
    ]);

    for (const sample of samples) {
        it(sample, async () => {
            const source = fse.readFileSync(sample, { encoding: "utf8" });
            const versionStrategy = new VersionDetectionStrategy(
                [source],
                new LatestVersionInEachSeriesStrategy()
            );

            const fileName = sample.replace(process.cwd() + "/", "");
            const args = additionalArgs.get(fileName);

            const [remappings, outputs, settings] =
                args === undefined ? [[], defaultCompilationOutput, defaultCompilerSettings] : args;

            let wasmResult: CompileResult | CompileFailedError;
            let nativeResult: CompileResult | CompileFailedError;

            try {
                wasmResult = await compileSol(
                    fileName,
                    versionStrategy,
                    remappings,
                    outputs,
                    settings,
                    CompilerKind.WASM
                );
            } catch (e) {
                if (e instanceof CompileFailedError) {
                    wasmResult = e;
                } else {
                    throw e;
                }
            }

            try {
                nativeResult = await compileSol(
                    fileName,
                    versionStrategy,
                    remappings,
                    outputs,
                    settings,
                    CompilerKind.Native
                );
            } catch (e) {
                if (e instanceof CompileFailedError) {
                    nativeResult = e;
                } else {
                    throw e;
                }
            }

            /**
             * Comparing the compiler outputs is tricky as there are subtle differences:
             * 1. For example for 0.4.x wasm always reports the old-style AST, while native reports
             * both the legacy and modern ast.
             */

            const normalizedWasmResult = normalizeOutput(wasmResult);
            const normalizedNativeResult = normalizeOutput(nativeResult);

            expect(normalizedWasmResult).toEqual(normalizedNativeResult);
        });
    }
});
