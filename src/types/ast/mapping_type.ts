import { Range } from "../../misc";
import { TypeNode } from "./type";

export class MappingType extends TypeNode {
    public readonly keyType: TypeNode;
    public readonly valueType: TypeNode;

    constructor(keyType: TypeNode, valueType: TypeNode, src?: Range) {
        super(src);

        this.keyType = keyType;
        this.valueType = valueType;
    }

    pp(): string {
        return `mapping(${this.keyType.pp()} => ${this.valueType.pp()})`;
    }

    getFields(): any[] {
        return [this.keyType, this.valueType];
    }
}
