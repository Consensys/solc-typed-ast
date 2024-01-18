#!/usr/bin/env node
import { Command } from "commander";
import fse from "fs-extra";
import {
    ASTKind,
    ASTNode,
    ASTNodeFormatter,
    ASTReader,
    ASTWriter,
    bytesToString,
    CACHE_DIR,
    CompilationOutput,
    CompileFailedError,
    compileJson,
    compileJsonData,
    CompileResult,
    CompilerKind,
    CompilerVersions,
    compileSol,
    compileSourceString,
    ContractDefinition,
    DefaultASTWriterMapping,
    downloadSupportedCompilers,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    FunctionVisibility,
    InferType,
    isExact,
    LatestCompilerVersion,
    PathOptions,
    PossibleCompilerKinds,
    PrettyFormatter,
    SourceUnit,
    StateVariableVisibility,
    VariableDeclaration,
    XPath
} from "..";

enum CompileMode {
    Auto = "auto",
    Sol = "sol",
    Json = "json"
}

const compileModes = Object.values(CompileMode);

function terminate(message?: string, exitCode = 0): never {
    if (message !== undefined) {
        if (exitCode === 0) {
            console.log(message);
        } else {
            console.error(message);
        }
    }

    process.exit(exitCode);
}

function error(message: string): never {
    terminate(message, 1);
}

(async () => {
    const { version } = require("../../package.json");

    const program = new Command();

    program
        .name("sol-ast-compile")
        .description("Compiles Solidity input and prints typed AST.")
        .version(version, "-v, --version", "Print package version.")
        .helpOption("-h, --help", "Print help message.");

    program.argument(
        "[file(s)]",
        "Either one or more Solidity files, one JSON compiler output file."
    );

    program
        .option("--solidity-versions", "Print information about supported Solidity versions.")
        .option("--stdin", "Read input from STDIN instead of files.")
        .option(
            "--mode <mode>",
            `One of the following input modes: "${CompileMode.Sol}" (Solidity source), "${CompileMode.Json}" (JSON compiler artifact), "${CompileMode.Auto}" (try to detect by file extension)`,
            CompileMode.Auto
        )
        .option(
            "--compiler-version <compilerVersion>",
            `Solc version to use: ${LatestCompilerVersion} (exact SemVer version specifier), auto (try to detect suitable compiler version)`,
            "auto"
        )
        .option(
            "--compiler-kind <compilerKind>",
            `Type of Solidity compiler to use. Currently supported values are "${CompilerKind.WASM}" or "${CompilerKind.Native}".`,
            CompilerKind.WASM
        )
        .option("--path-remapping <pathRemapping>", "Path remapping input for Solc.")
        .option("--base-path <basePath>", "Base path for compiler to look for files Solc.")
        .option(
            "--include-path <includePath...>",
            "Include paths for compiler to additinally look for files. Supports multiple entries."
        )
        .option(
            "--compiler-settings <compilerSettings>",
            `Additional settings passed to the solc compiler in the form of a JSON string (e.g. '{"optimizer": {"enabled": true, "runs": 200}}'). Note the double quotes. For more details see https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description.`
        )
        .option("--raw", "Print raw Solc compilation output.")
        .option(
            "--with-sources",
            'When used with "raw", adds "source" property with source files content to the compiler artifact.'
        )
        .option("--tree", "Print short tree of parent-child relations in AST.")
        .option("--source", "Print source code, assembled from Solc-generated AST.")
        .option("--xpath <xpath>", "XPath selector to perform for each source unit.")
        .option(
            "--depth <depth>",
            'Number of children for each of AST node to print. Minimum value is 0. Not affects "raw", "tree" and "source".',
            `${Number.MAX_SAFE_INTEGER}`
        )
        .option(
            "--locate-compiler-cache",
            "Print location of current compiler cache directory (used to store downloaded compilers)."
        )
        .option(
            "--download-compilers <compilerKind...>",
            `Download specified kind of supported compilers to compiler cache. Supports multiple entries.`
        );

    program.parse(process.argv);

    const args = program.args;
    const options = program.opts();

    if (options.solidityVersions) {
        const message = [
            "Latest supported version: " + LatestCompilerVersion,
            "",
            `All supported versions (${CompilerVersions.length} total):`,
            ...CompilerVersions
        ].join("\n");

        terminate(message);
    }

    if (options.locateCompilerCache) {
        terminate(CACHE_DIR);
    }

    if (options.downloadCompilers) {
        const compilerKinds = options.downloadCompilers.map((kind: string): CompilerKind => {
            if (PossibleCompilerKinds.has(kind)) {
                return kind as CompilerKind;
            }

            error(
                `Invalid compiler kind "${kind}". Possible values: ${[
                    ...PossibleCompilerKinds.values()
                ].join(", ")}.`
            );
        });

        console.log(
            `Downloading compilers (${compilerKinds.join(", ")}) to current compiler cache:`
        );

        for await (const compiler of downloadSupportedCompilers(compilerKinds)) {
            console.log(`${compiler.path} (${compiler.constructor.name} v${compiler.version})`);
        }

        terminate();
    }

    if (options.help || (!args.length && !options.stdin)) {
        terminate(program.helpInformation());
    }

    const stdin: boolean = options.stdin;
    const mode: CompileMode = options.mode;
    const compilerKind: CompilerKind = options.compilerKind;

    if (!PossibleCompilerKinds.has(compilerKind)) {
        error(
            `Invalid compiler kind "${compilerKind}". Possible values: ${[
                ...PossibleCompilerKinds.values()
            ].join(", ")}.`
        );
    }

    if (!compileModes.includes(mode)) {
        error(`Invalid mode "${mode}". Possible values: ${compileModes.join(", ")}.`);
    }

    const compilerVersion: string = options.compilerVersion;

    if (!(compilerVersion === "auto" || isExact(compilerVersion))) {
        const message = [
            `Invalid compiler version "${compilerVersion}".`,
            'Possible values: "auto" or exact version string.'
        ].join(" ");

        error(message);
    }

    const pathOptions: PathOptions = {
        remapping: options.pathRemapping ? options.pathRemapping.split(";") : [],
        basePath: options.basePath,
        includePath: options.includePath
    };

    let compilerSettings: any = undefined;

    if (options.compilerSettings) {
        try {
            compilerSettings = JSON.parse(options.compilerSettings);
        } catch (e) {
            error(
                `Invalid compiler settings '${options.compilerSettings}'. Compiler settings must be a valid JSON object (${e}).`
            );
        }
    }

    const compilationOutput: CompilationOutput[] = [CompilationOutput.ALL];

    let result: CompileResult;

    try {
        if (stdin) {
            if (mode === "auto") {
                error(
                    'Mode "auto" is not supported for the input from STDIN. Explicitly specify "mode" as "sol" or "json" instead.'
                );
            }

            const fileName = "stdin";
            const content = await fse.readFile(process.stdin.fd, { encoding: "utf-8" });

            result =
                mode === "json"
                    ? await compileJsonData(
                          fileName,
                          JSON.parse(content),
                          compilerVersion,
                          compilationOutput,
                          compilerSettings,
                          compilerKind
                      )
                    : await compileSourceString(
                          fileName,
                          content,
                          compilerVersion,
                          pathOptions,
                          compilationOutput,
                          compilerSettings,
                          compilerKind
                      );
        } else {
            const fileNames = args;
            const singleFileName = fileNames[0];
            const iSingleFileName = singleFileName.toLowerCase();

            let isSol: boolean;
            let isJson: boolean;

            if (mode === "auto") {
                isSol = iSingleFileName.endsWith(".sol");
                isJson = iSingleFileName.endsWith(".json");
            } else {
                isSol = mode === "sol";
                isJson = mode === "json";
            }

            if (isSol) {
                result = await compileSol(
                    fileNames,
                    compilerVersion,
                    pathOptions,
                    compilationOutput,
                    compilerSettings,
                    compilerKind
                );
            } else if (isJson) {
                result = await compileJson(
                    singleFileName,
                    compilerVersion,
                    compilationOutput,
                    compilerSettings,
                    compilerKind
                );
            } else {
                error("Unable to auto-detect mode by the file name: " + singleFileName);
            }
        }
    } catch (e: any) {
        if (e instanceof CompileFailedError) {
            console.error("Compile errors encountered:");

            for (const failure of e.failures) {
                console.error(
                    failure.compilerVersion
                        ? `SolcJS ${failure.compilerVersion}:`
                        : "Unknown compiler:"
                );

                for (const error of failure.errors) {
                    console.error(error);
                }
            }

            error("Unable to compile due to errors above.");
        }

        error(e.message);
    }

    const { data, files } = result;

    if (options.raw) {
        if (options.withSources && files.size > 0) {
            if (!data.sources) {
                data.sources = {};
            }

            for (const [key, value] of files) {
                if (!data.sources[key]) {
                    data.sources[key] = {};
                }

                data.sources[key].source = bytesToString(value);
            }
        }

        const output = JSON.stringify(data, undefined, 4);

        terminate(output);
    }

    const separator = "-".repeat(60);
    const depth = parseInt(options.depth);

    const reader = new ASTReader();
    const units = reader.read(data, ASTKind.Any, files);

    if (options.tree) {
        const INDENT = "|   ";

        const writer = (inference: InferType, node: ASTNode) => {
            const level = node.getParents().length;
            const indent = INDENT.repeat(level);

            let message = node.type + " #" + node.id;

            if (node instanceof SourceUnit) {
                message += " -> " + node.absolutePath;
            } else if (node instanceof ContractDefinition) {
                message += " -> " + node.kind + " " + node.name;

                const interfaceId = inference.interfaceId(node);

                if (interfaceId) {
                    message += ` [id: ${interfaceId}]`;
                }
            } else if (node instanceof FunctionDefinition) {
                const signature =
                    node.vScope instanceof ContractDefinition &&
                    (node.visibility === FunctionVisibility.Public ||
                        node.visibility === FunctionVisibility.External)
                        ? inference.signature(node)
                        : undefined;

                if (signature) {
                    const selector = inference.signatureHash(node);

                    message += ` -> ${signature} [selector: ${selector}]`;
                } else {
                    message += ` -> ${node.kind}`;
                }
            } else if (node instanceof ErrorDefinition || node instanceof EventDefinition) {
                const signature = inference.signature(node);
                const selector = inference.signatureHash(node);

                message += ` -> ${signature} [selector: ${selector}]`;
            } else if (node instanceof VariableDeclaration) {
                if (node.stateVariable) {
                    message += ` -> ${node.typeString} ${node.visibility} ${node.name}`;

                    if (node.visibility === StateVariableVisibility.Public) {
                        const signature = inference.signature(node);
                        const selector = inference.signatureHash(node);

                        message += ` [getter: ${signature}, selector: ${selector}]`;
                    }
                } else {
                    message +=
                        node.name === ""
                            ? ` -> ${node.typeString}`
                            : ` -> ${node.typeString} ${node.name}`;
                }
            }

            console.log(indent + message);
        };

        const compilerVersion = result.compilerVersion || LatestCompilerVersion;
        const inference = new InferType(compilerVersion);

        for (const unit of units) {
            unit.walk(writer.bind(undefined, inference));

            console.log();
        }

        terminate();
    }

    if (options.xpath) {
        const selector = options.xpath;
        const formatter = new ASTNodeFormatter();

        for (const unit of units) {
            const xp = new XPath(unit);
            const queryResult = xp.query(selector);
            const output =
                queryResult instanceof Array
                    ? queryResult.map((value) => formatter.format(value, depth)).join("\n")
                    : formatter.format(queryResult, depth);

            console.log(unit.sourceEntryKey);
            console.log(separator);
            console.log(output);
        }

        terminate();
    }

    if (options.source) {
        let targetCompilerVersion: string;

        if (result.compilerVersion) {
            targetCompilerVersion = result.compilerVersion;
        } else if (compilerVersion !== "auto") {
            targetCompilerVersion = compilerVersion;
        } else {
            targetCompilerVersion = LatestCompilerVersion;
        }

        const formatter = new PrettyFormatter(4, 0);
        const writer = new ASTWriter(DefaultASTWriterMapping, formatter, targetCompilerVersion);

        for (const unit of units) {
            console.log("// " + separator);
            console.log("// " + unit.absolutePath);
            console.log("// " + separator);
            console.log(writer.write(unit));
        }

        terminate();
    }

    for (const unit of units) {
        console.log(unit.print(depth));
    }

    terminate();
})().catch((e) => {
    error(e.message);
});
