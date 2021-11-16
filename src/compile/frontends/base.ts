import { assert } from "../../misc";
import { isExact } from "../version";

export abstract class Compiler {
    constructor(public readonly version: string) {
        assert(
            isExact(version),
            "Version string must contain exact SemVer-formatted version without any operators"
        );
    }
}
