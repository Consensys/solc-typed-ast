import { TypeNode } from "./type";
import { Range } from "../../misc";

export class UserDefinedValueType extends TypeNode {
    public readonly name: string;
    public readonly innerType: TypeNode;

    constructor(name: string, innerType: TypeNode, src?: Range) {
        super(src);

        this.name = name;
        this.innerType = innerType;
    }

    pp(): string {
        return `udvt ${this.name} <${this.innerType.pp()}>`;
    }
}
