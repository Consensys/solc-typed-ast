import { ASTNodeWithChildren } from "../../ast_node";
import { UserDefinedTypeName } from "../type/user_defined_type_name";
import { IdentifierPath } from "./identifier_path";

export class OverrideSpecifier extends ASTNodeWithChildren<UserDefinedTypeName | IdentifierPath> {
    constructor(
        id: number,
        src: string,
        overrides: Iterable<UserDefinedTypeName | IdentifierPath>,
        raw?: any
    ) {
        super(id, src, raw);

        for (const override of overrides) {
            this.appendChild(override);
        }
    }

    /**
     * Reference to a user-defined types, whose functions are being overridden.
     */
    get vOverrides(): Array<UserDefinedTypeName | IdentifierPath> {
        return this.ownChildren;
    }
}
