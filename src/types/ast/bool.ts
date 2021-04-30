import { TypeNode } from "./type";
import { Range } from "../../misc";

export class BoolType extends TypeNode {
    constructor(src?: Range) {
        super(src);
    }

    pp(): string {
        return `bool`;
    }

    getFields(): any[] {
        return [];
    }
}
