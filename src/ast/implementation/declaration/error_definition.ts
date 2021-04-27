import { ASTNode } from "../../ast_node";
import { ParameterList } from "../meta/parameter_list";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { ContractDefinition } from "./contract_definition";

export class ErrorDefinition extends ASTNode {
    /**
     * The name of the error
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Optional documentation appearing above the error definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    documentation?: string | StructuredDocumentation;

    /**
     * A list of values that is passed on to the EVM logging facility
     */
    vParameters: ParameterList;

    constructor(
        id: number,
        src: string,
        type: string,
        name: string,
        parameters: ParameterList,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.name = name;
        this.documentation = documentation;
        this.nameLocation = nameLocation;

        this.vParameters = parameters;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.documentation, this.vParameters);
    }

    /**
     * Reference to its scoped contract
     */
    get vScope(): ContractDefinition {
        return this.parent as ContractDefinition;
    }
}
