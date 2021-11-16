import { gte, satisfies } from "semver";
import { assert } from "../../misc";
import { ImportFinder } from "../utils";
import { Compiler } from "./base";

export abstract class WasmCompiler extends Compiler {
    public readonly moduleName: string;
    public readonly module: any;

    constructor(version: string) {
        super(version);
        this.moduleName = `solc-${this.version}`;
        this.module = require(this.moduleName);
    }

    abstract compile(inputJSON: any, finder: ImportFinder): any;

    static getWasmCompilerForVersion(version: string): WasmCompiler {
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

    compile(inputJSON: any, finder: ImportFinder): any {
        return this.module.compile(inputJSON, 1, finder);
    }
}

export class WasmCompiler05 extends WasmCompiler {
    constructor(version: string) {
        super(version);
        assert(satisfies(version, "0.5"), `Can't build WasmCompiler04 with version ${version}`);
    }

    compile(inputJSON: any, finder: ImportFinder): any {
        const output = this.module.compile(JSON.stringify(inputJSON), finder);
        return JSON.parse(output);
    }
}

export class WasmCompiler06OrNewer extends WasmCompiler {
    constructor(version: string) {
        super(version);
        assert(gte(version, "0.6.0"), `Can't build WasmCompiler04 with version ${version}`);
    }

    compile(inputJSON: any, finder: ImportFinder): any {
        const callbacks = { import: finder };
        const output = this.module.compile(JSON.stringify(inputJSON), callbacks);
        try {
            return JSON.parse(output);
        } catch (e: any) {
            console.error(`Couldn't parse output`);
            console.error(output);
            throw e;
        }
    }
}
