#!/usr/bin/env node
import fse from "fs-extra";
import minimist from "minimist";
import path from "path";
import {
    ASTKind,
    ASTNode,
    ASTNodeCallback,
    ASTNodeFormatter,
    ASTReader,
    ASTWriter,
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
    isExact,
    LatestCompilerVersion,
    PrettyFormatter,
    SourceUnit,
    StateVariableVisibility,
    VariableDeclaration,
    XPath
} from "..";

const cli = {
    boolean: [
        "version",
        "help",
        "solidity-versions",
        "stdin",
        "raw",
        "with-sources",
        "tree",
        "source",
        "with-source-map"
    ],
    number: ["depth"],
    string: ["mode", "compiler-version", "path-remapping", "xpath"],
    default: {
        depth: Number.MAX_SAFE_INTEGER,
        mode: "auto",
        "compiler-version": "auto"
    }
};

const modes = ["auto", "sol", "json"];

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
                                - sol (Solidity source)
                                - json (JSON compiler artifact)
                                - auto (try to detect by file extension)
                            Default value: auto
    --compiler-version      Solc version to use:
                                - ${LatestCompilerVersion} (exact SemVer version specifier)
                                - auto (try to detect suitable compiler version)
                            Default value: auto
    --path-remapping        Path remapping input for Solc.
    --raw                   Print raw Solc compilation output.
    --with-sources          When used with "raw", adds "source" property with 
                            source files content to the compiler artifact.
    --tree                  Print short tree of parent-child relations in AST.
    --source                Print source code, assembled from Solc-generated AST.
    --with-source-map       When used with "source", adds source map coordinates
                            for the written nodes.
    --xpath                 XPath selector to perform for each source unit.
    --depth                 Number of children for each of AST node to print.
                            Minimum value is 0. Not affects "raw", "tree" and "source".
                            Default value: ${Number.MAX_SAFE_INTEGER}
`;

    console.log(message);
} else {
    const stdin: boolean = args.stdin;
    const mode: string = args.mode;

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

    let fileName = args._[0];
    let result: CompileResult;

    try {
        if (stdin) {
            if (mode === "auto") {
                throw new Error(
                    'Mode "auto" is not supported for the input from STDIN. Explicitly specify "mode" as "sol" or "json" instead.'
                );
            }

            fileName = "stdin";

            const content = fse.readFileSync(0, { encoding: "utf-8" });

            if (mode === "json") {
                const data = JSON.parse(content);

                result = compileJsonData(fileName, data, compilerVersion, pathRemapping);
            } else {
                result = compileSourceString(fileName, content, compilerVersion, pathRemapping);
            }
        } else {
            fileName = path.resolve(process.cwd(), args._[0]);

            if (mode === "auto") {
                if (fileName.toLowerCase().endsWith(".sol")) {
                    result = compileSol(fileName, compilerVersion, pathRemapping);
                } else if (fileName.toLowerCase().endsWith(".json")) {
                    result = compileJson(fileName, compilerVersion, pathRemapping);
                } else {
                    throw new Error("Unable to auto-detect mode for the file name: " + fileName);
                }
            } else {
                result =
                    mode === "json"
                        ? compileJson(fileName, compilerVersion, pathRemapping)
                        : compileSol(fileName, compilerVersion, pathRemapping);
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
        const walker: ASTNodeCallback = (node) => {
            const level = node.getParents().length;
            const indent = INDENT.repeat(level);

            let message = node.type + " #" + node.id;

            if (node instanceof SourceUnit) {
                message += " -> " + node.absolutePath;
            } else if (node instanceof ContractDefinition) {
                message += " -> " + node.kind + " " + node.name;

                const interfaceId = node.interfaceId;

                if (interfaceId !== undefined) {
                    message += ` [id: ${interfaceId}]`;
                }
            } else if (node instanceof FunctionDefinition) {
                const signature = node.canonicalSignature;

                if (signature) {
                    const selector = node.canonicalSignatureHash;

                    message += ` -> ${signature} [selector: ${selector}]`;
                } else {
                    message += ` -> ${node.kind}`;
                }
            } else if (node instanceof VariableDeclaration) {
                if (node.stateVariable) {
                    message += ` -> ${node.typeString} ${node.visibility} ${node.name}`;

                    if (node.visibility === StateVariableVisibility.Public) {
                        const signature = node.getterCanonicalSignature;
                        const selector = node.getterCanonicalSignatureHash;

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
        const formatter = new PrettyFormatter(4, 0);
        const writer = new ASTWriter(
            DefaultASTWriterMapping,
            formatter,
            result.compilerVersion ? result.compilerVersion : LatestCompilerVersion
        );

        for (const unit of units) {
            const sourceMap = new Map<ASTNode, [number, number]>();
            const source = writer.write(unit, sourceMap);

            if (args["with-source-map"]) {
                console.log(source);

                for (const [node, [offset, length]] of sourceMap.entries()) {
                    const nodeStr = node.type + "#" + node.id + " (" + node.src + ")";
                    const coordsStr = offset + ":" + length + ":" + unit.sourceListIndex;

                    console.log("// " + nodeStr + " -> " + coordsStr);
                }
            } else {
                console.log("// " + separator);
                console.log("// " + unit.absolutePath);
                console.log("// " + separator);
                console.log(source);
            }
        }

        process.exit(0);
    }

    for (const unit of units) {
        console.log(unit.print(depth));
    }

    process.exit(0);
}
