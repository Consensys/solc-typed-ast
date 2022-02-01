import { lt } from "semver";
import { CompilationOutput, CompilerKind } from "./constants";

export interface PartialSolcInput {
    language: "Solidity";
    settings: { outputSelection: any; [otherKeys: string]: any };
    [otherKeys: string]: any;
}

export interface Solc04Input extends PartialSolcInput {
    sources: { [fileName: string]: string };
}

export interface Solc05Input extends PartialSolcInput {
    sources: { [fileName: string]: { content: string } };
}

export type SolcInput = Solc04Input | Solc05Input;

function mergeCompilerSettings<T extends Solc04Input | Solc05Input>(input: T, settings: any): T {
    if (settings !== undefined) {
        for (const key in settings) {
            if (key === "outputSelection") {
                continue;
            }

            input.settings[key] = settings[key];
        }
    }

    return input;
}

/**
 * Create valid standard JSON input for the solidity compiler as specified in
 * https://docs.soliditylang.org/en/latest/using-the-compiler.html.
 *
 * This handles the differences in the JSON input between different compiler versions.
 */
export function createCompilerInput(
    files: Map<string, string>,
    version: string,
    kind: CompilerKind,
    output: CompilationOutput[],
    compilerSettings: any
): SolcInput {
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
            outputSelection: {
                "*": {
                    "*": contractOutput,
                    "": fileOutput
                }
            }
        }
    };

    partialInp.sources = {};

    // Note that prior to 0.5.0 the WASM compiler had a slightly
    // different format for specifying versions.
    if (lt(version, "0.5.0") && kind === CompilerKind.WASM) {
        for (const [fileName, content] of files.entries()) {
            partialInp.sources[fileName] = content;
        }
    } else {
        for (const [fileName, content] of files.entries()) {
            partialInp.sources[fileName] = { content };
        }
    }

    const input = partialInp as Solc04Input | Solc05Input;

    return mergeCompilerSettings(input, compilerSettings);
}
