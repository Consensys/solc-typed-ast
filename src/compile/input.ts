import { lt } from "semver";
import { CompilerKind } from "../ast/constants";
import { CompilationOutput } from "./constants";

export interface PartialSolcInput {
    language: "Solidity";
    settings: { remappings: string[]; outputSelection: any; [otherKeys: string]: any };
    [otherKeys: string]: any;
}

export interface Solc04Input extends PartialSolcInput {
    sources: { [fileName: string]: string };
}

export interface Solc05Input extends PartialSolcInput {
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

export function createCompilerInput(
    files: Map<string, string>,
    version: string,
    frontend: CompilerKind,
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

    partialInp.sources = {};
    if (lt(version, "0.5.0") && frontend === CompilerKind.WASM) {
        for (const [fileName, content] of files.entries()) {
            partialInp.sources[fileName] = content;
        }
    } else {
        for (const [fileName, content] of files.entries()) {
            partialInp.sources[fileName] = { content };
        }
    }

    const inp = partialInp as Solc04Input | Solc05Input;

    return mergeCompilerSettings(inp, compilerSettings);
}
