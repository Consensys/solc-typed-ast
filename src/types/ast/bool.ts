import { TypeNode } from "./type";

export class BoolType extends TypeNode {
    pp(): string {
        return "bool";
    }

    getFields(): any[] {
        return [];
    }
}
