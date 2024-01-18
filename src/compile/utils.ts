import fse from "fs-extra";
import path from "path";
import { FileSystemResolver, getCompilerForVersion, LocalNpmResolver } from ".";
import { assert, stringToBytes } from "../misc";
import {
    CompilerVersionSelectionStrategy,
    LatestVersionInEachSeriesStrategy,
    RangeVersionStrategy,
    VersionDetectionStrategy
} from "./compiler_selection";
import { CompilationOutput, CompilerKind } from "./constants";
import { Remapping } from "./import_resolver";
import { findAllFiles } from "./inference";
import { createCompilerInput } from "./input";
import { FileMap } from "../ast";

export interface PathOptions {
    remapping?: string[];
    basePath?: string;
    includePath?: string[];
}

export interface MemoryStorage {
    [path: string]: {
        source: string | undefined;
    };
}

export interface CompileResult {
    /**
     * Raw compiler JSON output
     */
    data: any;

    /**
     * Compiler version used
     */
    compilerVersion?: string;

    /**
     * Map from file-names (either passed in by caller, or source unit names of imported files)
     * to the contents of the respective files.
     */
    files: FileMap;

    /**
     * Map from file-names appearing in the `files` map, to the
     * actual resolved paths on disk (if any).
     *
     * For `compileJSONData()` this maps each unit absolutePath to itself as no resolution is done.
     *
     */
    resolvedFileNames: Map<string, string>;

    /**
     * Map from file-names to the remapping inferred to resolve that given file-name
     */
    inferredRemappings: Map<string, Remapping>;
}

export interface CompileFailure {
    errors: string[];
    compilerVersion?: string;
}

export class CompileInferenceError extends Error {}

export class CompileFailedError extends Error {
    failures: CompileFailure[];

    constructor(entries: CompileFailure[]) {
        super();

        this.failures = entries;

        const formattedErrorStr = entries.map(
            (entry) => `==== ${entry.compilerVersion} ====:\n ${entry.errors.join("\n")}\n`
        );

        this.message = `Compiler Errors: ${formattedErrorStr}`;
    }
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

function fillFilesFromSources(files: FileMap, sources: { [fileName: string]: any }): void {
    for (const [fileName, section] of Object.entries(sources)) {
        if (section && typeof section.source === "string") {
            files.set(fileName, stringToBytes(section.source));
        }
    }
}

function getCompilerVersionStrategy(
    sources: Uint8Array[],
    versionOrStrategy: string | CompilerVersionSelectionStrategy
): CompilerVersionSelectionStrategy {
    if (versionOrStrategy === "auto") {
        return new VersionDetectionStrategy(sources, new LatestVersionInEachSeriesStrategy());
    }

    if (typeof versionOrStrategy === "string") {
        return new RangeVersionStrategy([versionOrStrategy]);
    }

    return versionOrStrategy;
}

export async function compile(
    files: FileMap,
    remapping: string[],
    version: string,
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    kind = CompilerKind.WASM
): Promise<any> {
    const compilerInput = createCompilerInput(
        files,
        remapping,
        compilationOutput,
        compilerSettings
    );

    const compiler = await getCompilerForVersion(version, kind);

    assert(
        compiler !== undefined,
        `Couldn't find "${kind}" compiler for version ${version} for current platform`
    );

    return compiler.compile(compilerInput);
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
    pathOptions: PathOptions = {},
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult> {
    const basePath =
        pathOptions.basePath === undefined ? path.dirname(fileName) : pathOptions.basePath;

    const includePath = pathOptions.includePath;
    const remapping = pathOptions.remapping || [];

    const inferredRemappings = new Map<string, Remapping>();

    const fsResolver = new FileSystemResolver(basePath, includePath);
    const npmResolver = new LocalNpmResolver(basePath, inferredRemappings);
    const resolvers = [fsResolver, npmResolver];

    const parsedRemapping = parsePathRemapping(remapping);
    const files = new Map([[fileName, stringToBytes(sourceCode)]]);
    const resolvedFileNames = new Map([[fileName, fileName]]);

    await findAllFiles(files, resolvedFileNames, parsedRemapping, resolvers);

    const compilerVersionStrategy = getCompilerVersionStrategy([...files.values()], version);
    const failures: CompileFailure[] = [];

    for (const compilerVersion of compilerVersionStrategy.select()) {
        const data = await compile(
            files,
            remapping,
            compilerVersion,
            compilationOutput,
            compilerSettings,
            kind
        );

        const errors = detectCompileErrors(data);

        if (errors.length === 0) {
            return {
                data,
                compilerVersion,
                files,
                resolvedFileNames,
                inferredRemappings
            };
        }

        failures.push({ compilerVersion, errors });
    }

    throw new CompileFailedError(failures);
}

export async function compileSol(
    fileName: string,
    version: string | CompilerVersionSelectionStrategy,
    pathOptions?: PathOptions,
    compilationOutput?: CompilationOutput[],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult>;
export async function compileSol(
    fileNames: string[],
    version: string | CompilerVersionSelectionStrategy,
    pathOptions?: PathOptions,
    compilationOutput?: CompilationOutput[],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult>;
export async function compileSol(
    input: string | string[],
    version: string | CompilerVersionSelectionStrategy,
    pathOptions: PathOptions = {},
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult> {
    const fileNames = typeof input === "string" ? [input] : input;

    assert(fileNames.length > 0, "There must be at least one file to compile");

    const inferredRemappings = new Map<string, Remapping>();
    const fsResolver = new FileSystemResolver(pathOptions.basePath, pathOptions.includePath);
    const npmResolver = new LocalNpmResolver(pathOptions.basePath, inferredRemappings);
    const resolvers = [fsResolver, npmResolver];

    const remapping = pathOptions.remapping || [];
    const parsedRemapping = parsePathRemapping(remapping);

    const files: FileMap = new Map();
    const resolvedFileNames = new Map<string, string>();
    const visited = new Set<string>();

    const isDynamicBasePath = pathOptions.basePath === undefined;

    for (const fileName of fileNames) {
        const resolvedFileName = fsResolver.resolve(fileName);

        assert(resolvedFileName !== undefined, `Unable to find "${fileName}"`);

        const sourceCode = await fse.readFile(resolvedFileName);

        if (isDynamicBasePath) {
            const basePath = path.dirname(resolvedFileName);

            fsResolver.basePath = basePath;
            npmResolver.basePath = basePath;
        }

        files.set(resolvedFileName, sourceCode);

        /**
         * Add self-mapping as we need every key in `files`
         * to also be defined in `resolvedFileNames`
         */
        resolvedFileNames.set(resolvedFileName, resolvedFileName);

        /**
         * Set the resolved path for every file passed in by the caller as well
         */
        resolvedFileNames.set(fileName, resolvedFileName);

        await findAllFiles(files, resolvedFileNames, parsedRemapping, resolvers, visited);
    }

    const compilerVersionStrategy = getCompilerVersionStrategy([...files.values()], version);
    const failures: CompileFailure[] = [];

    for (const compilerVersion of compilerVersionStrategy.select()) {
        const data = await compile(
            files,
            remapping,
            compilerVersion,
            compilationOutput,
            compilerSettings,
            kind
        );

        const errors = detectCompileErrors(data);

        if (errors.length === 0) {
            return {
                data,
                compilerVersion,
                files,
                resolvedFileNames,
                inferredRemappings
            };
        }

        failures.push({ compilerVersion, errors });
    }

    throw new CompileFailedError(failures);
}

export async function compileJsonData(
    fileName: string,
    data: any,
    version: string | CompilerVersionSelectionStrategy,
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult> {
    const files: FileMap = new Map();

    if (!(data instanceof Object && data.sources instanceof Object)) {
        throw new Error(`Unable to find required properties in "${fileName}"`);
    }

    const sources: { [fileName: string]: any } = data.sources;
    const resolvedFileNames = new Map<string, string>(Object.keys(sources).map((x) => [x, x]));

    if (consistentlyContainsOneOf(sources, "ast", "legacyAST", "AST")) {
        const compilerVersion = undefined;
        const errors = detectCompileErrors(data);

        if (errors.length) {
            throw new CompileFailedError([{ compilerVersion, errors }]);
        }

        fillFilesFromSources(files, sources);

        return {
            data,
            compilerVersion,
            files,
            resolvedFileNames,
            inferredRemappings: new Map()
        };
    }

    if (consistentlyContainsOneOf(sources, "source")) {
        for (const [fileName, fileData] of Object.entries<{ source: string }>(sources)) {
            files.set(fileName, stringToBytes(fileData.source));
        }

        const compilerVersionStrategy = getCompilerVersionStrategy([...files.values()], version);
        const failures: CompileFailure[] = [];

        for (const compilerVersion of compilerVersionStrategy.select()) {
            const compileData = await compile(
                files,
                [],
                compilerVersion,
                compilationOutput,
                compilerSettings,
                kind
            );

            const errors = detectCompileErrors(compileData);

            if (errors.length === 0) {
                return {
                    data: compileData,
                    compilerVersion,
                    files,
                    resolvedFileNames,
                    inferredRemappings: new Map()
                };
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
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any,
    kind?: CompilerKind
): Promise<CompileResult> {
    const data = await fse.readJSON(fileName);

    return compileJsonData(fileName, data, version, compilationOutput, compilerSettings, kind);
}
