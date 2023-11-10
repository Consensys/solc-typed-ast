import {
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
import { VariableDeclaration } from "./variable_declaration";

export class StructDefinition extends ASTNodeWithChildren<
    StructuredDocumentation | VariableDeclaration
> {
    docString?: string;
    danglingDocString?: string;

    /**
     * The name of the struct
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Node id of scoped contract or source unit
     */
    scope: number;

    /**
     * Struct visibility
     */
    visibility: string;

    constructor(
        id: number,
        src: string,
        name: string,
        scope: number,
        visibility: string,
        members: Iterable<VariableDeclaration>,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.name = name;
        this.scope = scope;
        this.visibility = visibility;
        this.documentation = documentation;
        this.nameLocation = nameLocation;

        for (const member of members) {
            this.appendChild(member);
        }
    }

    /**
     * Canonical name (or qualified name), e.g. `DefiningContract.SomeStruct`
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
     * Members of the struct
     */
    get vMembers(): readonly VariableDeclaration[] {
        return this.ownChildren.filter(
            (node): node is VariableDeclaration => node instanceof VariableDeclaration
        );
    }

    /**
     * Reference to its scoped contract or source unit
     */
    get vScope(): ContractDefinition | SourceUnit {
        return this.requiredContext.locate(this.scope) as ContractDefinition | SourceUnit;
    }

    set vScope(value: ContractDefinition | SourceUnit) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.scope = value.id;
    }
}
