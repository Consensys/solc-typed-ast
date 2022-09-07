import { VersionDependentType } from "../builtins";
import { getTypeForCompilerVersion } from "../utils";
import { BuiltinType } from "./builtin_type";
import { TypeNode } from "./type";

/**
 * A utility type for referencing builtin structs.
 * It is not directly referenced in typeString parser grammar.
 */
export class BuiltinStructType extends BuiltinType {
    readonly members: Map<string, VersionDependentType[]>;

    constructor(name: string, members: Map<string, VersionDependentType[]>) {
        super(name);

        this.members = members;
    }

    pp(): string {
        return `${this.name}`;
    }

    getFieldForVersion(fieldName: string, version: string): TypeNode | undefined {
        const versionDepFields = this.members.get(fieldName);

        if (!versionDepFields) {
            return undefined;
        }

        for (const versionDepField of versionDepFields) {
            const typ = getTypeForCompilerVersion(versionDepField, version);

            if (typ) {
                return typ;
            }
        }

        return undefined;
    }
}
