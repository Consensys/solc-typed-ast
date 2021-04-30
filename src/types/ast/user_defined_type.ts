import { ContractDefinition, ContractKind, EnumDefinition, StructDefinition } from "../../ast";
import { Range } from "../../misc";
import { TypeNode } from "./type";

export type UserDefinition = StructDefinition | EnumDefinition | ContractDefinition;

export class UserDefinedType extends TypeNode {
    public readonly name: string;

    public definition: UserDefinition;

    constructor(name: string, definition: UserDefinition, src?: Range) {
        super(src);

        this.name = name;
        this.definition = definition;
    }

    pp(): string {
        let typePrefix: string;

        if (this.definition instanceof StructDefinition) {
            typePrefix = "struct";
        } else if (this.definition instanceof EnumDefinition) {
            typePrefix = "enum";
        } else {
            typePrefix = this.definition.kind == ContractKind.Library ? "library" : "contract";
        }

        return `${typePrefix} ${this.name}`;
    }

    getFields(): any[] {
        return [this.name];
    }
}
