import { TypeNode } from "./type";

export abstract class PackedArrayType extends TypeNode {
    getFields(): any[] {
        return [];
    }
}
