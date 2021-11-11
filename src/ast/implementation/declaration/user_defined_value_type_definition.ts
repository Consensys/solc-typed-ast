import { ASTNode } from "../../ast_node";
import { SourceUnit } from "../meta/source_unit";
import { ElementaryTypeName } from "../type/elementary_type_name";
import { ContractDefinition } from "./contract_definition";

export class UserDefinedValueTypeDefinition extends ASTNode {
    /**
     * The name of the user-defined value type definition
     */
    name: string;

    /**
     * Canonical name (or qualified name), e.g. `DefiningContract.SomeType`.
     * Is `undefined` for Solidity 0.8.8. Available since Solidity 0.8.9.
     */
    canonicalName?: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Aliased value type
     */
    underlyingType: ElementaryTypeName;

    constructor(
        id: number,
        src: string,
        type: string,
        name: string,
        canonicalName: string | undefined,
        underlyingType: ElementaryTypeName,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.name = name;
        this.canonicalName = canonicalName;
        this.underlyingType = underlyingType;
        this.nameLocation = nameLocation;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.underlyingType);
    }

    /**
     * Reference to its scoped contract or source unit
     */
    get vScope(): ContractDefinition | SourceUnit {
        return this.parent as ContractDefinition | SourceUnit;
    }
}
