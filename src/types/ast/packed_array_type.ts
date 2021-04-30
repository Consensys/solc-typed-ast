import { TypeNode } from "./type";
import { Range } from "../../misc";

export abstract class PackedArrayType extends TypeNode {
    constructor(src?: Range) {
        super(src);
    }

    getFields(): any[] {
        return [];
    }
}
