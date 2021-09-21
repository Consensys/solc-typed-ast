#!/usr/bin/env node
import fse from "fs-extra";
import minimist from "minimist";
import path from "path";
import {
    ASTKind,
    ASTNodeCallback,
    ASTNodeFormatter,
    ASTReader,
    ASTWriter,
    CompilationOutput,
    CompileFailedError,
    compileJson,
    compileJsonData,
    CompileResult,
    CompilerVersions,
    compileSol,
    compileSourceString,
    ContractDefinition,
    DefaultASTWriterMapping,
    FunctionDefinition,
    FunctionVisibility,
    getABIEncoderVersion,
    isExact,
    LatestCompilerVersion,
    PrettyFormatter,
    SourceUnit,
    StateVariableVisibility,
    VariableDeclaration,
    XPath
} from "..";
import { CompilationFrontend, PossibleCompilationFrontends } from "../ast";

const modes = ["auto", "sol", "json"];

const cli = {
    boolean: [
        "version",
        "help",
        "solidity-versions",
        "stdin",
        "raw",
        "with-sources",
        "tree",
        "source"
    ],
    number: ["depth"],
    string: [
        "mode",
        "compiler-version",
        "path-remapping",
        "xpath",
        "compiler-settings",
        "frontend"
    ],
    default: {
        depth: Number.MAX_SAFE_INTEGER,
        mode: modes[0],
        "compiler-version": "auto",
        frontend: "default"
    }
};

const args = minimist(process.argv.slice(2), cli);

if (args.version) {
    const { version } = require("../../package.json");

    console.log(version);
} else if (args["solidity-versions"]) {
    const message = [
        "Latest supported version: " + LatestCompilerVersion,
        "",
        `All supported versions (${CompilerVersions.length} total):`,
        ...CompilerVersions
    ].join("\n");

    console.log(message);
} else if (args.help || (!args._.length && !args.stdin)) {
    const message = `Compiles Solidity input and prints typed AST.

USAGE:

$ sol-ast-compile <filename>

OPTIONS:
    --help                  Print help message.
    --version               Print package version.
    --solidity-versions     Print information about supported Solidity versions.
    --stdin                 Read input from STDIN instead of files.
                            Requires "mode" to be explicitly set to "sol" or "json".
    --mode                  One of the following input types:
                                - ${modes[1]} (Solidity source)
                                - ${modes[2]} (JSON compiler artifact)
                                - ${modes[0]} (try to detect by file extension)
                            Default value: ${cli.default.mode}
    --compiler-version      Solc version to use:
                                - ${LatestCompilerVersion} (exact SemVer version specifier)
                                - auto (try to detect suitable compiler version)
                            Default value: ${cli.default["compiler-version"]}
    --path-remapping        Path remapping input for Solc.
    --compiler-settings     Additional settings passed to the solc compiler in the form of a
                            JSON string (e.g. '{"optimizer": {"enabled": true, "runs": 200}}').
                            Note the double quotes. For more details see https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description.
    --raw                   Print raw Solc compilation output.
    --with-sources          When used with "raw", adds "source" property with 
                            source files content to the compiler artifact.
    --tree                  Print short tree of parent-child relations in AST.
    --source                Print source code, assembled from Solc-generated AST.
    --xpath                 XPath selector to perform for each source unit.
    --depth                 Number of children for each of AST node to print.
                            Minimum value is 0. Not affects "raw", "tree" and "source".
                            Default value: ${cli.default.depth}
`;

    console.log(message);
} else {
    const stdin: boolean = args.stdin;
    const mode: string = args.mode;

    if (!PossibleCompilationFrontends.has(args.frontend)) {
        throw new Error(
            `Invalid frontend "${args.frontend}". Possible values: ${[
                ...PossibleCompilationFrontends.values()
            ].join(", ")}.`
        );
    }

    const frontend = args.frontend as CompilationFrontend;

    if (!modes.includes(mode)) {
        throw new Error(`Invalid mode "${mode}". Possible values: ${modes.join(", ")}.`);
    }

    const compilerVersion: string = args["compiler-version"];

    if (!(compilerVersion === "auto" || isExact(compilerVersion))) {
        const message = [
            `Invalid compiler version "${compilerVersion}".`,
            'Possible values: "auto" or exact version string.'
        ].join(" ");

        throw new Error(message);
    }

    const pathRemapping: string[] = args["path-remapping"] ? args["path-remapping"].split(";") : [];
    let compilerSettings: any = undefined;

    if (args["compiler-settings"]) {
        try {
            compilerSettings = JSON.parse(args["compiler-settings"]);
        } catch (e) {
            throw new Error(
                `Invalid compiler settings '${args["compiler-settings"]}'. Compiler settings must be a valid JSON object.(${e})`
            );
        }
    }

    let fileName = args._[0];
    let result: CompileResult;
    const compilationOutput: CompilationOutput[] = [CompilationOutput.ALL];

    try {
        if (stdin) {
            if (mode === "auto") {
                throw new Error(
                    'Mode "auto" is not supported for the input from STDIN. Explicitly specify "mode" as "sol" or "json" instead.'
                );
            }

            fileName = "stdin";

            const content = fse.readFileSync(0, { encoding: "utf-8" });

            result =
                mode === "json"
                    ? compileJsonData(
                          fileName,
                          JSON.parse(content),
                          compilerVersion,
                          pathRemapping,
                          compilationOutput,
                          compilerSettings,
                          frontend
                      )
                    : compileSourceString(
                          fileName,
                          content,
                          compilerVersion,
                          pathRemapping,
                          compilationOutput,
                          compilerSettings,
                          frontend
                      );
        } else {
            fileName = path.resolve(process.cwd(), args._[0]);

            if (mode === "auto") {
                const iFileName = fileName.toLowerCase();

                if (iFileName.endsWith(".sol")) {
                    result = compileSol(
                        fileName,
                        compilerVersion,
                        pathRemapping,
                        compilationOutput,
                        compilerSettings,
                        frontend
                    );
                } else if (iFileName.endsWith(".json")) {
                    result = compileJson(
                        fileName,
                        compilerVersion,
                        pathRemapping,
                        compilationOutput,
                        compilerSettings,
                        frontend
                    );
                } else {
                    throw new Error("Unable to auto-detect mode for the file name: " + fileName);
                }
            } else {
                result =
                    mode === "json"
                        ? compileJson(
                              fileName,
                              compilerVersion,
                              pathRemapping,
                              compilationOutput,
                              compilerSettings
                          )
                        : compileSol(
                              fileName,
                              compilerVersion,
                              pathRemapping,
                              compilationOutput,
                              compilerSettings
                          );
            }
        }
    } catch (e) {
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

            process.exit(1);
        }

        throw e;
    }

    const { data, files } = result;

    if (args.raw) {
        if (args["with-sources"] && files.size > 0) {
            if (!data.sources) {
                data.sources = {};
            }

            for (const [key, value] of files) {
                if (!data.sources[key]) {
                    data.sources[key] = {};
                }

                data.sources[key].source = value;
            }
        }

        const output = JSON.stringify(data, undefined, 4);

        console.log(output);

        process.exit(0);
    }

    const separator = "-".repeat(60);
    const depth = args.depth;

    const reader = new ASTReader();
    const units = reader.read(data, ASTKind.Any, files);

    if (args.tree) {
        const INDENT = "|   ";

        const encoderVersion = result.compilerVersion
            ? getABIEncoderVersion(units, result.compilerVersion as string)
            : undefined;

        const walker: ASTNodeCallback = (node) => {
            const level = node.getParents().length;
            const indent = INDENT.repeat(level);

            let message = node.type + " #" + node.id;

            if (node instanceof SourceUnit) {
                message += " -> " + node.absolutePath;
            } else if (node instanceof ContractDefinition) {
                message += " -> " + node.kind + " " + node.name;

                const interfaceId = encoderVersion ? node.interfaceId(encoderVersion) : undefined;

                if (interfaceId !== undefined) {
                    message += ` [id: ${interfaceId}]`;
                }
            } else if (node instanceof FunctionDefinition) {
                const signature =
                    node.vScope instanceof ContractDefinition &&
                    (node.visibility === FunctionVisibility.Public ||
                        node.visibility === FunctionVisibility.External) &&
                    encoderVersion
                        ? node.canonicalSignature(encoderVersion)
                        : undefined;

                if (signature && encoderVersion) {
                    const selector = node.canonicalSignatureHash(encoderVersion);

                    message += ` -> ${signature} [selector: ${selector}]`;
                } else {
                    message += ` -> ${node.kind}`;
                }
            } else if (node instanceof VariableDeclaration) {
                if (node.stateVariable) {
                    message += ` -> ${node.typeString} ${node.visibility} ${node.name}`;

                    if (node.visibility === StateVariableVisibility.Public && encoderVersion) {
                        const signature = node.getterCanonicalSignature(encoderVersion);
                        const selector = node.getterCanonicalSignatureHash(encoderVersion);

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

        for (const unit of units) {
            unit.walk(walker);

            console.log();
        }

        process.exit(0);
    }

    if (args.xpath) {
        const selector = args.xpath;
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

        process.exit(0);
    }

    if (args.source) {
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

        process.exit(0);
    }

    for (const unit of units) {
        console.log(unit.print(depth));
    }

    process.exit(0);
}
