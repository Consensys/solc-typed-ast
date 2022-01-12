import fse from "fs-extra";
import { getCompilerPrefixForOs } from "./frontends";
import { CompilationFrontend } from "../ast";
import {
    CompilerVersionSelectionStrategy,
    LatestVersionInEachSeriesStrategy,
    RangeVersionStrategy,
    VersionDetectionStrategy
} from "./compiler_selection";
import { CompilationOutput } from "./constants";
import { WasmCompiler } from "./frontends/wasm";
import { Remapping } from "./import_resolver";
import { getNativeCompilerForVersion } from "./frontends/native_compilers";
import { isExact } from "./version";
import { findAllFiles } from "./inference";
import { createCompilerInput } from "./input";
import { FileSystemResolver } from ".";

export interface MemoryStorage {
    [path: string]: {
        source: string | undefined;
    };
}

export interface CompileResult {
    data: any;
    compilerVersion?: string;
    files: Map<string, string>;
}

export interface CompileFailure {
    errors: string[];
    compilerVersion?: string;
}

export class CompileFailedError extends Error {
    failures: CompileFailure[];

    constructor(entries: CompileFailure[]) {
        super();

        this.failures = entries;
    }
}

export function getWasmCompilerForVersion(version: string): any {
    if (isExact(version)) {
        return require("solc-" + version);
    }

    throw new Error(
        "Version string must contain exact SemVer-formatted version without any operators"
    );
}

function consistentlyContainsOneOf(
    sources: { [key: string]: any },
    ...properties: string[]
): boolean {
    const sections = Object.values(sources);

    for (const property of properties) {
        if (sections.every((section) => property in section)) {
            return true;
        }
    }

    return false;
}

function fillFilesFromSources(
    files: Map<string, string>,
    sources: { [fileName: string]: any }
): void {
    for (const [fileName, section] of Object.entries(sources)) {
        if (section && typeof section.source === "string") {
            files.set(fileName, section.source);
        }
    }
}

function detectMainFileName(data: any): string | undefined {
    if (data.sources) {
        const sources = data.sources;

        if (data.mainSource && data.mainSource in sources) {
            return data.mainSource;
        }

        const main = Object.values(sources).find((section: any) => section.main);

        if (main) {
            for (const key in sources) {
                if (sources[key] === main) {
                    return key;
                }
            }
        }
    }

    return undefined;
}

function getCompilerVersionStrategy(
    sourceCode: string,
    versionOrStrategy: string | CompilerVersionSelectionStrategy
): CompilerVersionSelectionStrategy {
    if (versionOrStrategy === "auto") {
        return new VersionDetectionStrategy(sourceCode, new LatestVersionInEachSeriesStrategy());
    }

    if (typeof versionOrStrategy === "string") {
        return new RangeVersionStrategy([versionOrStrategy]);
    }

    return versionOrStrategy;
}

export function parsePathRemapping(remapping: string[]): Remapping[] {
    const rxRemapping = /^(([^:]*):)?([^=]*)=(.+)$/;
    const result: Array<[string, string, string]> = remapping.map((entry) => {
        const matches = entry.match(rxRemapping);

        if (matches === null) {
            throw new Error(`Invalid remapping entry "${entry}"`);
        }

        return [matches[2] === undefined ? "" : matches[2], matches[3], matches[4]];
    });

    return result;
}

export async function compile(
    fileName: string,
    content: string,
    version: string,
    raw_remappings: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    frontend = CompilationFrontend.Default
): Promise<any> {
    if (frontend === CompilationFrontend.Default) {
        frontend = CompilationFrontend.Native;
    }

    const files = new Map<string, string>([[fileName, content]]);
    const remappings = parsePathRemapping(raw_remappings);
    // TODO (dimo): Add LocalNPMResolver below
    const additionalFiles = findAllFiles(files, remappings, [new FileSystemResolver()]);

    for (const [name, cont] of additionalFiles) {
        files.set(name, cont);
    }
    //console.error(`files keys: ${[...files.keys()]}`);

    const input = createCompilerInput(
        files,
        version,
        frontend,
        compilationOutput,
        raw_remappings,
        compilerSettings
    );

    //console.error(`input.sources keys: ${[...Object.keys(input.sources)]}`);

    if (frontend === CompilationFrontend.WASM) {
        const compiler = WasmCompiler.getWasmCompilerForVersion(version);

        return compiler.compile(input);
    } else if (frontend === CompilationFrontend.Native) {
        const compiler = await getNativeCompilerForVersion(version);

        if (compiler === undefined) {
            throw new Error(
                `Couldn't find native compiler for version ${version} for current platform ${getCompilerPrefixForOs()}`
            );
        }
        return compiler.compile(input);
    } else {
        throw new Error(`NYI Compiler Frontend ${frontend}`);
    }
}

export function detectCompileErrors(data: any): string[] {
    const errors: string[] = [];

    if (data.errors instanceof Array) {
        for (const error of data.errors) {
            const typeOf = typeof error;

            if (typeOf === "object") {
                /**
                 * Solc >= 0.5
                 */
                if (error.severity === "error") {
                    errors.push(error.formattedMessage);
                }
            } else if (typeOf === "string") {
                /**
                 * Solc < 0.5
                 */
                if (!error.match("Warning")) {
                    errors.push(error);
                }
            }
        }
    }

    return errors;
}

export async function compileSourceString(
    fileName: string,
    sourceCode: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    frontend = CompilationFrontend.Default
): Promise<CompileResult> {
    const compilerVersionStrategy = getCompilerVersionStrategy(sourceCode, version);
    const files = new Map([[fileName, sourceCode]]);
    const failures: CompileFailure[] = [];

    for (const compilerVersion of compilerVersionStrategy.select()) {
        const data = await compile(
            fileName,
            sourceCode,
            compilerVersion,
            remapping,
            compilationOutput,
            compilerSettings,
            frontend
        );
        const errors = detectCompileErrors(data);

        if (errors.length === 0) {
            return { data, compilerVersion, files };
        }

        failures.push({ compilerVersion, errors });
    }

    for (const failure of failures) {
        console.error(failure.compilerVersion, ": ", JSON.stringify(failure.errors));
    }
    throw new CompileFailedError(failures);
}

export async function compileSol(
    fileName: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    frontend = CompilationFrontend.Default
): Promise<CompileResult> {
    const source = fse.readFileSync(fileName, { encoding: "utf-8" });

    return await compileSourceString(
        fileName,
        source,
        version,
        remapping,
        compilationOutput,
        compilerSettings,
        frontend
    );
}

export async function compileJsonData(
    fileName: string,
    data: any,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    frontend = CompilationFrontend.Default
): Promise<CompileResult> {
    const files = new Map<string, string>();

    if (!(data instanceof Object && data.sources instanceof Object)) {
        throw new Error(`Unable to find required properties in "${fileName}"`);
    }

    const sources: { [fileName: string]: any } = data.sources;

    if (consistentlyContainsOneOf(sources, "ast", "legacyAST", "AST")) {
        const compilerVersion = undefined;
        const errors = detectCompileErrors(data);

        if (errors.length) {
            throw new CompileFailedError([{ compilerVersion, errors }]);
        }

        fillFilesFromSources(files, sources);

        return { data, compilerVersion, files };
    }

    if (consistentlyContainsOneOf(sources, "source")) {
        const mainFileName = detectMainFileName(data);
        const sourceCode: string | undefined = mainFileName
            ? sources[mainFileName].source
            : undefined;

        if (!(mainFileName && sourceCode)) {
            throw new Error("Unable to detect main source to compile");
        }

        const compilerVersionStrategy = getCompilerVersionStrategy(sourceCode, version);

        files.set(mainFileName, sourceCode);

        const failures: CompileFailure[] = [];

        for (const compilerVersion of compilerVersionStrategy.select()) {
            const compileData = await compile(
                mainFileName,
                sourceCode,
                compilerVersion,
                remapping,
                compilationOutput,
                compilerSettings,
                frontend
            );

            const errors = detectCompileErrors(compileData);

            if (errors.length === 0) {
                return { data: compileData, compilerVersion, files };
            }

            failures.push({ compilerVersion, errors });
        }

        throw new CompileFailedError(failures);
    }

    throw new Error(
        "Unable to process data structure: neither consistent AST or code values are present"
    );
}

export async function compileJson(
    fileName: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    frontend = CompilationFrontend.Default
): Promise<CompileResult> {
    const data = fse.readJSONSync(fileName);

    return compileJsonData(
        fileName,
        data,
        version,
        remapping,
        compilationOutput,
        compilerSettings,
        frontend
    );
}
