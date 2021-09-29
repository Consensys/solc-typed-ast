import fse from "fs-extra";
import path from "path";
import { lt, satisfies } from "semver";
import {
    CompilerVersionSelectionStrategy,
    LatestVersionInEachSeriesStrategy,
    RangeVersionStrategy,
    VersionDetectionStrategy
} from "./compiler_selection";
import { CompilationOutput } from "./constants";
import {
    FileSystemResolver,
    ImportResolver,
    LocalNpmResolver,
    Remapping,
    RemappingResolver
} from "./import_resolver";
import { isExact } from "./version";

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

export type ImportFinder = (filePath: string) => { contents: string } | { error: string };

export function getCompilerForVersion(version: string): any {
    if (isExact(version)) {
        return require("solc-" + version);
    }

    throw new Error(
        "Version string must contain exact SemVer-formatted version without any operators"
    );
}

interface PartialSolcInput {
    language: "Solidity";
    settings: { remappings: string[]; outputSelection: any; [otherKeys: string]: any };
    [otherKeys: string]: any;
}

interface Solc04Input extends PartialSolcInput {
    sources: { [fileName: string]: string };
}

interface Solc05Input extends PartialSolcInput {
    sources: { [fileName: string]: { content: string } };
}

function mergeCompilerSettings<T extends Solc04Input | Solc05Input>(input: T, settings: any): T {
    if (settings !== undefined) {
        for (const key in settings) {
            if (key === "remappings" || key === "outputSelection") {
                continue;
            }

            input.settings[key] = settings[key];
        }
    }

    return input;
}

function createCompilerInput(
    fileName: string,
    version: string,
    content: string,
    output: CompilationOutput[],
    remappings: string[],
    compilerSettings: any
): Solc04Input | Solc05Input {
    let fileOutput: string[] = [];
    let contractOutput: string[] = [];

    for (const outputSel of output) {
        if (outputSel === CompilationOutput.ALL) {
            fileOutput = [CompilationOutput.ALL];
            contractOutput = [CompilationOutput.ALL];
            break;
        }

        if (outputSel === CompilationOutput.AST) {
            fileOutput.push(outputSel);
        } else {
            contractOutput.push(outputSel);
        }
    }

    const partialInp: PartialSolcInput = {
        language: "Solidity",
        settings: {
            remappings,
            outputSelection: {
                "*": {
                    "*": contractOutput,
                    "": fileOutput
                }
            }
        }
    };

    if (lt(version, "0.5.0")) {
        partialInp.sources = {
            [fileName]: content
        };
    } else {
        partialInp.sources = {
            [fileName]: { content }
        };
    }

    const inp = partialInp as Solc04Input | Solc05Input;

    return mergeCompilerSettings(inp, compilerSettings);
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

export function createFileSystemImportFinder(
    fileName: string,
    files: Map<string, string>,
    remapping: Remapping[]
): ImportFinder {
    const basePath = path.dirname(fileName);
    const resolvers: ImportResolver[] = [
        new FileSystemResolver(),
        new RemappingResolver(remapping),
        new LocalNpmResolver(basePath)
    ];

    return (filePath) => {
        try {
            for (const resolver of resolvers) {
                const resolvedPath = resolver.resolve(filePath);

                if (resolvedPath) {
                    const contents = fse.readFileSync(resolvedPath).toString();

                    files.set(filePath, contents);

                    return { contents };
                }
            }

            throw new Error(`Unable to find import path "${filePath}"`);
        } catch (e) {
            return { error: e.message };
        }
    };
}

export function createMemoryImportFinder(
    storage: MemoryStorage,
    files: Map<string, string>
): ImportFinder {
    if (storage === null || storage === undefined) {
        throw new Error("Storage must be an object");
    }

    return (filePath) => {
        const entry = storage[filePath];

        if (!entry) {
            return { error: `Import path "${filePath}" not found in storage` };
        }

        if (entry.source === undefined) {
            return { error: `Entry at "${filePath}" contains no "source" property` };
        }

        const contents = entry.source;

        files.set(filePath, contents);

        return { contents };
    };
}

export function compile(
    fileName: string,
    content: string,
    version: string,
    finder: ImportFinder,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any
): any {
    const compiler = getCompilerForVersion(version);
    const input = createCompilerInput(
        fileName,
        version,
        content,
        compilationOutput,
        remapping,
        compilerSettings
    );

    if (satisfies(version, "0.4")) {
        const output = compiler.compile(input, 1, finder);

        return output;
    }

    if (satisfies(version, "0.5")) {
        const output = compiler.compile(JSON.stringify(input), finder);

        return JSON.parse(output);
    }

    const callbacks = { import: finder };
    const output = compiler.compile(JSON.stringify(input), callbacks);

    return JSON.parse(output);
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

export function compileSourceString(
    fileName: string,
    sourceCode: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any
): CompileResult {
    const compilerVersionStrategy = getCompilerVersionStrategy(sourceCode, version);
    const files = new Map([[fileName, sourceCode]]);
    const failures: CompileFailure[] = [];

    for (const compilerVersion of compilerVersionStrategy.select()) {
        const finder = createFileSystemImportFinder(
            fileName,
            files,
            satisfies(compilerVersion, "0.4") ? parsePathRemapping(remapping) : []
        );

        const data = compile(
            fileName,
            sourceCode,
            compilerVersion,
            finder,
            remapping,
            compilationOutput,
            compilerSettings
        );
        const errors = detectCompileErrors(data);

        if (errors.length === 0) {
            return { data, compilerVersion, files };
        }

        failures.push({ compilerVersion, errors });
    }

    throw new CompileFailedError(failures);
}

export function compileSol(
    fileName: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any
): CompileResult {
    const source = fse.readFileSync(fileName, { encoding: "utf-8" });

    return compileSourceString(
        fileName,
        source,
        version,
        remapping,
        compilationOutput,
        compilerSettings
    );
}

export function compileJsonData(
    fileName: string,
    data: any,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any
): CompileResult {
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

        const finder = createMemoryImportFinder(sources, files);
        const failures: CompileFailure[] = [];

        for (const compilerVersion of compilerVersionStrategy.select()) {
            const compileData = compile(
                mainFileName,
                sourceCode,
                compilerVersion,
                finder,
                remapping,
                compilationOutput,
                compilerSettings
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

export function compileJson(
    fileName: string,
    version: string | CompilerVersionSelectionStrategy,
    remapping: string[],
    compilationOutput: CompilationOutput[] = [CompilationOutput.ALL],
    compilerSettings?: any
): CompileResult {
    const data = fse.readJSONSync(fileName);

    return compileJsonData(fileName, data, version, remapping, compilationOutput, compilerSettings);
}
