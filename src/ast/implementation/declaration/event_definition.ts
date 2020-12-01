import { ASTNode } from "../../ast_node";
import { encodeSignature } from "../../utils";
import { ParameterList } from "../meta/parameter_list";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { ContractDefinition } from "./contract_definition";

export class EventDefinition extends ASTNode {
    /**
     * The hash of the signature of the event is one of the topics
     * except if you set `anonymous`.
     */
    anonymous: boolean;

    /**
     * The name of the event
     */
    name: string;

    /**
     * Optional documentation appearing above the event definition:
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
        anonymous: boolean,
        name: string,
        parameters: ParameterList,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.anonymous = anonymous;
        this.name = name;
        this.documentation = documentation;

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

    /**
     * Returns canonical representation of the event signature as string
     */
    get canonicalSignature(): string {
        const args = this.vParameters.vParameters.map((arg) => arg.canonicalSignatureType);

        return this.name + "(" + args.join(",") + ")";
    }

    /**
     * Returns HEX string containing first 4 bytes of Keccak256 hash function
     * applied to the canonical representation of the event signature.
     */
    get canonicalSignatureHash(): string {
        return encodeSignature(this.canonicalSignature);
    }
}
