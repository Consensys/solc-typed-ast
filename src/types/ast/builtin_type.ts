import { TypeNode } from "./type";
import { Range } from "../../misc";

export class BuiltinType extends TypeNode {
    readonly name: string;

    constructor(name: string, src?: Range) {
        super(src);
        this.name = name;
    }

    pp(): string {
        return `${this.name}`;
    }

    getFields(): any[] {
        return [this.name];
    }
}
