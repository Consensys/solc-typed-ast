import { getTypeForCompilerVersion, VersionDependentType } from "../utils";
import { BuiltinType } from "./builtin_type";
import { TypeNode } from "./type";

/**
 * A utility type for referencing builtin structs.
 * It is not directly referenced in typeString parser grammar.
 */
export class BuiltinStructType extends BuiltinType {
    readonly members: Map<string, VersionDependentType>;

    constructor(name: string, members: Map<string, VersionDependentType>) {
        super(name);

        this.members = members;
    }

    pp(): string {
        return `${this.name}`;
    }

    getFieldForVersion(fieldName: string, version: string): TypeNode | undefined {
        const versionDepField = this.members.get(fieldName);

        if (!versionDepField) {
            return undefined;
        }

        return getTypeForCompilerVersion(versionDepField, version);
    }

    getFields(): any[] {
        return [this.name];
    }
}
