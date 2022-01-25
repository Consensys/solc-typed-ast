import { assert } from "../../misc";
import { SolcInput } from "../input";
import { isExact } from "../version";

export abstract class Compiler {
    constructor(public readonly version: string) {
        assert(
            isExact(version),
            "Version string must contain exact SemVer-formatted version without any operators"
        );
    }

    abstract compile(inputJson: SolcInput): Promise<any>;
}
