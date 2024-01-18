import { FileMap } from "../ast";
import { bytesToString } from "../misc";
import { CompilationOutput } from "./constants";

export interface PartialSolcInput {
    language: "Solidity";

    settings: {
        outputSelection: any;
        remappings: string[];
        [otherKeys: string]: any;
    };

    [otherKeys: string]: any;
}

export interface SolcInput extends PartialSolcInput {
    sources: {
        [fileName: string]: {
            content: string;
        };
    };
}

function mergeCompilerSettings<T extends SolcInput>(input: T, settings: any): T {
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
    files: FileMap,
    remappings: string[],
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
            remappings,
            outputSelection: {
                "*": {
                    "*": contractOutput,
                    "": fileOutput
                }
            }
        }
    };

    partialInp.sources = {};

    for (const [fileName, content] of files.entries()) {
        partialInp.sources[fileName] = { content: bytesToString(content) };
    }

    const input = partialInp as SolcInput;

    return mergeCompilerSettings(input, compilerSettings);
}
