import {
    enumToIntType,
    getDanglingDocumentation,
    getDocumentation,
    getFQDefName,
    setDanglingDocumentation,
    setDocumentation
} from "../../..";
import { ASTNodeWithChildren } from "../../ast_node";
import { SourceUnit } from "../meta/source_unit";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { ContractDefinition } from "./contract_definition";
import { EnumValue } from "./enum_value";

export class EnumDefinition extends ASTNodeWithChildren<StructuredDocumentation | EnumValue> {
    docString?: string;
    danglingDocString?: string;

    /**
     * The name of the enum
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    constructor(
        id: number,
        src: string,
        name: string,
        members: Iterable<EnumValue>,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.name = name;

        for (const member of members) {
            this.appendChild(member);
        }

        this.documentation = documentation;
        this.nameLocation = nameLocation;
    }

    /**
     * Canonical name (or qualified name), e.g. `DefiningContract.SomeEnum`
     */
    get canonicalName(): string {
        return getFQDefName(this);
    }

    /**
     * Optional documentation appearing above the contract definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    get documentation(): string | StructuredDocumentation | undefined {
        return getDocumentation(this);
    }

    set documentation(value: string | StructuredDocumentation | undefined) {
        setDocumentation(this, value);
    }

    /**
     * Optional documentation that is dangling in the source fragment,
     * that is after end of last child and before the end of the current node.
     *
     * It is:
     * - Is `undefined` when not detected.
     * - Is type of `string` for compatibility reasons.
     */
    get danglingDocumentation(): string | StructuredDocumentation | undefined {
        return getDanglingDocumentation(this);
    }

    set danglingDocumentation(value: string | StructuredDocumentation | undefined) {
        setDanglingDocumentation(this, value);
    }

    /**
     * Array of the enum values
     */
    get vMembers(): readonly EnumValue[] {
        return this.ownChildren.filter((node): node is EnumValue => node instanceof EnumValue);
    }

    /**
     * Reference to a scoped contract or source unit
     */
    get vScope(): ContractDefinition | SourceUnit {
        return this.parent as ContractDefinition | SourceUnit;
    }

    toUintTypeString(): string {
        return enumToIntType(this).pp();
    }
}
