import { gte, satisfies } from "semver";
import { isExact } from "..";
import { assert } from "../../misc";
import { Compiler } from "./base";

const nullFinder = (): { error: string } => {
    return {
        error: "Finders not supported."
    };
};

export abstract class WasmCompiler extends Compiler {
    public readonly moduleName: string;
    private _module: any = undefined;

    constructor(version: string) {
        super(version);
        this.moduleName = `solc-${this.version}`;
    }

    public get module(): any {
        if (this._module === undefined) {
            this._module = require(`solc-${this.version}`);
        }

        return this._module;
    }

    // TODO(@pavel): Maybe we make this async the same way it is for native_compiler, and execute the
    // compilation in separate process? This way the node module gets loaded in separate process? This might
    // solve memory issues with wasm, but on the other hand this would slow down additional re-compilations. Thoughts?
    abstract compile(inputJSON: any): any;

    static getWasmCompilerForVersion(version: string): WasmCompiler {
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
}

export class WasmCompiler04 extends WasmCompiler {
    constructor(version: string) {
        super(version);
        assert(satisfies(version, "0.4"), `Can't build WasmCompiler04 with version ${version}`);
    }

    compile(inputJSON: any): any {
        return this.module.compile(inputJSON, 1, nullFinder);
    }
}

export class WasmCompiler05 extends WasmCompiler {
    constructor(version: string) {
        super(version);
        assert(satisfies(version, "0.5"), `Can't build WasmCompiler04 with version ${version}`);
    }

    compile(inputJSON: any): any {
        const output = this.module.compile(JSON.stringify(inputJSON), nullFinder);
        return JSON.parse(output);
    }
}

export class WasmCompiler06OrNewer extends WasmCompiler {
    constructor(version: string) {
        super(version);
        assert(gte(version, "0.6.0"), `Can't build WasmCompiler04 with version ${version}`);
    }

    compile(inputJSON: any): any {
        const callbacks = { import: nullFinder };
        const output = this.module.compile(JSON.stringify(inputJSON), callbacks);
        return JSON.parse(output);
    }
}
