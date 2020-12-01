import { ASTNodeWithChildren } from "../../ast_node";
import { UserDefinedTypeName } from "../type/user_defined_type_name";

export class OverrideSpecifier extends ASTNodeWithChildren<UserDefinedTypeName> {
    constructor(
        id: number,
        src: string,
        type: string,
        overrides: Iterable<UserDefinedTypeName>,
        raw?: any
    ) {
        super(id, src, type, raw);

        for (const override of overrides) {
            this.appendChild(override);
        }
    }

    /**
     * Reference to a user-defined types, whose functions are being overridden.
     */
    get vOverrides(): UserDefinedTypeName[] {
        return this.ownChildren as UserDefinedTypeName[];
    }
}
