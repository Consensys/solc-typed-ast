import { ASTNode } from "../../ast_node";
import { FunctionKind, FunctionStateMutability, FunctionVisibility } from "../../constants";
import { ModifierInvocation } from "../meta/modifier_invocation";
import { OverrideSpecifier } from "../meta/override_specifier";
import { ParameterList } from "../meta/parameter_list";
import { SourceUnit } from "../meta/source_unit";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { Block } from "../statement/block";
import { ContractDefinition } from "./contract_definition";

export class FunctionDefinition extends ASTNode {
    /**
     * Is `false` if the function not have an implementation
     * and `true` if it is implemented in place.
     */
    implemented: boolean;

    /**
     * Is `true` if function is declared as possibly overridable
     * (using `virtual` keyword since Solidity 0.6).
     *
     * Is `false` otherwise.
     */
    virtual: boolean;

    /**
     * Node id of scoped contract or source unit
     */
    scope: number;

    /**
     * A kind of a function definition
     */
    kind: FunctionKind;

    /**
     * Identifier of the function
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Function visibility, for example: `public`, `internal`, `private` or `external`.
     */
    visibility: FunctionVisibility;

    /**
     * Function state mutability, that is non-payable, `payable`, `pure` or `view`.
     * Deprecated `constant` is only allowed in 0.4.x
     */
    stateMutability: FunctionStateMutability;

    /**
     * Set if it is a constructor
     */
    isConstructor: boolean;

    /**
     * Optional documentation appearing above the function definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    documentation?: string | StructuredDocumentation;

    /**
     * Invoked modifiers
     */
    vModifiers: ModifierInvocation[];

    /**
     * Function body block: can be empty if function is declared, but not implemented.
     * Always filled otherwise.
     */
    vBody?: Block;

    /**
     * Override specifier if provided
     */
    vOverrideSpecifier?: OverrideSpecifier;

    /**
     * A list of local variables that are declared and initialized with the input values
     */
    vParameters: ParameterList;

    /**
     * A list of local variables that are declared and returned to the caller
     */
    vReturnParameters: ParameterList;

    constructor(
        id: number,
        src: string,
        scope: number,
        kind: FunctionKind,
        name: string,
        virtual: boolean,
        visibility: FunctionVisibility,
        stateMutability: FunctionStateMutability,
        isConstructor: boolean,
        parameters: ParameterList,
        returnParameters: ParameterList,
        modifiers: ModifierInvocation[],
        overrideSpecifier?: OverrideSpecifier,
        body?: Block,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.implemented = body !== undefined;
        this.virtual = virtual;
        this.scope = scope;
        this.kind = kind;
        this.name = name;
        this.visibility = visibility;
        this.stateMutability = stateMutability;
        this.isConstructor = isConstructor;
        this.documentation = documentation;
        this.nameLocation = nameLocation;

        this.vParameters = parameters;
        this.vReturnParameters = returnParameters;
        this.vModifiers = modifiers;
        this.vOverrideSpecifier = overrideSpecifier;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(
            this.documentation,
            this.vParameters,
            this.vOverrideSpecifier,
            this.vModifiers,
            this.vReturnParameters,
            this.vBody
        );
    }

    /**
     * Reference to a scoped `ContractDefinition` if function is declared in contract.
     * Reference to a scoped `SourceUnit` if function is declared on file level
     * (since Solidity 0.7.1).
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
