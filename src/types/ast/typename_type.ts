import { Range } from "../../misc";
import { TypeNode } from "./type";

export class TypeNameType extends TypeNode {
    public readonly type: TypeNode;

    constructor(type: TypeNode, src?: Range) {
        super(src);

        this.type = type;
    }

    pp(): string {
        return `type(${this.type.pp()})`;
    }

    getFields(): any[] {
        return [this.type];
    }
}
