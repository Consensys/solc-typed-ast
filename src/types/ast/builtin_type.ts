import { Range } from "../../misc";
import { TypeNode } from "./type";

export class BuiltinType extends TypeNode {
    readonly name: string;

    constructor(name: string, src?: Range) {
        super(src);

        this.name = name;
    }

    pp(): string {
        return this.name;
    }
}
