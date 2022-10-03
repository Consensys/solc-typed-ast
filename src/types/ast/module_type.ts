import { Range } from "../../misc";
import { TypeNode } from "./type";

// NOTE: This class is only used by the TypeString parser and should be
// considered deprecated.
// @deprecated
export class ModuleType extends TypeNode {
    readonly path: string;

    constructor(path: string, src?: Range) {
        super(src);

        this.path = path;
    }

    pp(): string {
        return `module "${this.path}"`;
    }
}
