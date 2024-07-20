import { TypeNode } from "./type";
import { Range } from "../../misc";

export class BuiltinErrorType extends TypeNode {
    constructor(src?: Range) {
        super(src);
    }

    pp(): string {
        return `error`;
    }
}
