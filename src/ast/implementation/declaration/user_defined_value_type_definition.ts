import { getUserDefinedTypeFQName } from "../../..";
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
        name: string,
        underlyingType: ElementaryTypeName,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.name = name;
        this.underlyingType = underlyingType;
        this.nameLocation = nameLocation;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.underlyingType);
    }

    /**
     * Canonical name (or qualified name), e.g. `DefiningContract.SomeType`
     */
    get canonicalName(): string {
        return getUserDefinedTypeFQName(this);
    }

    /**
     * Reference to its scoped contract or source unit
     */
    get vScope(): ContractDefinition | SourceUnit {
        return this.parent as ContractDefinition | SourceUnit;
    }
}
