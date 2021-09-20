import { Range } from "../../misc";
import { VersionDependentType } from "../utils";
import { BuiltinType } from "./builtin_type";

/**
 * A utility type for referencing builtin structs.
 * It is not directly referenced in typeString parser grammar.
 */
export class BuiltinStructType extends BuiltinType {
    readonly members: Map<string, VersionDependentType>;

    constructor(name: string, members: Map<string, VersionDependentType>, src?: Range) {
        super(name, src);

        this.members = members;
    }

    pp(): string {
        return `builtin_struct ${this.name}`;
    }

    getFields(): any[] {
        return [this.name];
    }
}
