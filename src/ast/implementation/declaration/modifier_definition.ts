import { ASTNode } from "../../ast_node";
import { OverrideSpecifier } from "../meta/override_specifier";
import { ParameterList } from "../meta/parameter_list";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { Block } from "../statement/block";
import { ContractDefinition } from "./contract_definition";

export class ModifierDefinition extends ASTNode {
    /**
     * Modifier name
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Is `true` if modifier is declared as possibly overridable
     * (using `virtual` keyword since Solidity 0.6.7).
     *
     * Is `false` otherwise.
     */
    virtual: boolean;

    /**
     * Declaration visibility
     */
    visibility: string;

    /**
     * Optional documentation appearing above the modifier definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    documentation?: string | StructuredDocumentation;

    /**
     * Modifier parameters are local variables within modifier body
     */
    vParameters: ParameterList;

    /**
     * Override specifier if provided
     */
    vOverrideSpecifier?: OverrideSpecifier;

    /**
     * Modifier body
     */
    vBody?: Block;

    constructor(
        id: number,
        src: string,
        name: string,
        virtual: boolean,
        visibility: string,
        parameters: ParameterList,
        overrideSpecifier?: OverrideSpecifier,
        body?: Block,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.name = name;
        this.virtual = virtual;
        this.visibility = visibility;
        this.documentation = documentation;
        this.nameLocation = nameLocation;

        this.vParameters = parameters;
        this.vOverrideSpecifier = overrideSpecifier;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(
            this.documentation,
            this.vParameters,
            this.vOverrideSpecifier,
            this.vBody
        );
    }

    /**
     * Reference to its scoped contract
     */
    get vScope(): ContractDefinition {
        return this.parent as ContractDefinition;
    }
}
