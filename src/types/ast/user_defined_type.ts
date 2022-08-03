import {
    ContractDefinition,
    ContractKind,
    EnumDefinition,
    StructDefinition,
    UserDefinedValueTypeDefinition
} from "../../ast";
import { Range } from "../../misc";
import { TypeNode } from "./type";

export type UserDefinition =
    | StructDefinition
    | EnumDefinition
    | ContractDefinition
    | UserDefinedValueTypeDefinition;

export class UserDefinedType extends TypeNode {
    public readonly name: string;

    public definition: UserDefinition;

    constructor(name: string, definition: UserDefinition, src?: Range) {
        super(src);

        this.name = name;
        this.definition = definition;
    }

    pp(): string {
        if (this.definition instanceof UserDefinedValueTypeDefinition) {
            return this.name;
        }

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
        // Its possible to have the same user defined type imported with 2 different names
        return [this.definition.id];
    }
}
