import { Range } from "../../misc";
import { TypeNode } from "./type";

export class ModuleType extends TypeNode {
    readonly path: string;

    constructor(path: string, src?: Range) {
        super(src);

        this.path = path;
    }

    pp(): string {
        return `module "${this.path}"`;
    }

    getFields(): any[] {
        return [this.path];
    }
}
