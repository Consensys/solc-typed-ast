import { gte, satisfies } from "semver";
import { isExact } from "..";
import { assert } from "../../misc";
import { SolcInput } from "../input";
import { Compiler } from "./compiler";

/**
 * Imports are handled by the preprecessing parser,
 * so there is no need to use finder callbacks.
 */
const nullFinder = (): { error: string } => {
    return { error: "Finders not supported" };
};

export abstract class WasmCompiler extends Compiler {
    get moduleName(): string {
        return `solc-${this.version}`;
    }

    get module(): any {
        return require(this.moduleName);
    }
}

export class WasmCompiler04 extends WasmCompiler {
    constructor(version: string) {
        super(version);

        assert(satisfies(version, "0.4"), `Can't build WasmCompiler04 with version ${version}`);
    }

    async compile(inputJson: SolcInput): Promise<any> {
        return this.module.compile(inputJson, 1, nullFinder);
    }
}

export class WasmCompiler05 extends WasmCompiler {
    constructor(version: string) {
        super(version);

        assert(satisfies(version, "0.5"), `Can't build WasmCompiler04 with version ${version}`);
    }

    async compile(inputJson: SolcInput): Promise<any> {
        const output = this.module.compile(JSON.stringify(inputJson), nullFinder);

        return JSON.parse(output);
    }
}

export class WasmCompiler06OrNewer extends WasmCompiler {
    constructor(version: string) {
        super(version);

        assert(gte(version, "0.6.0"), `Can't build WasmCompiler04 with version ${version}`);
    }

    async compile(inputJson: SolcInput): Promise<any> {
        const callbacks = { import: nullFinder };

        const output = this.module.compile(JSON.stringify(inputJson), callbacks);

        return JSON.parse(output);
    }
}

export function getWasmCompilerForVersion(version: string): WasmCompiler {
    if (!isExact(version)) {
        throw new Error(
            "Wasm compiler version string must contain exact SemVer-formatted version without any operators"
        );
    }

    if (satisfies(version, "0.4")) {
        return new WasmCompiler04(version);
    }

    if (satisfies(version, "0.5")) {
        return new WasmCompiler05(version);
    }

    return new WasmCompiler06OrNewer(version);
}
