import { ContractDefinition, StructDefinition } from "../../ast";
import { Range } from "../../misc";
import { TypeNode } from "./type";
import { UserDefinedType } from "./user_defined_type";

export class TypeNameType extends TypeNode {
    public readonly type: TypeNode;

    constructor(type: TypeNode, src?: Range) {
        super(src);

        this.type = type;
    }

    pp(): string {
        return `type(${this.type.pp()})`;
    }

    typeString(): string {
        if (
            this.type instanceof UserDefinedType &&
            this.type.definition instanceof StructDefinition &&
            this.type.definition.vScope instanceof ContractDefinition
        ) {
            // For some reason the typestring of the struct type itself contains a pointer..
            return `type(${this.type.pp()} storage pointer)`;
        }

        return this.pp();
    }

    getFields(): any[] {
        return [this.type];
    }
}
