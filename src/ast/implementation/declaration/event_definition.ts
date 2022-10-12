import { ABIEncoderVersion } from "../../../types/abi";
import { ASTNode } from "../../ast_node";
import { encodeEventSignature } from "../../utils";
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
     * The source range for name string
     */
    nameLocation?: string;

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
        anonymous: boolean,
        name: string,
        parameters: ParameterList,
        documentation?: string | StructuredDocumentation,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.anonymous = anonymous;
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

    /**
     * Returns canonical representation of the event signature as string
     *
     * @deprecated
     */
    canonicalSignature(encoderVersion: ABIEncoderVersion): string {
        const args = this.vParameters.vParameters.map((arg) =>
            arg.canonicalSignatureType(encoderVersion)
        );

        return this.name + "(" + args.join(",") + ")";
    }

    /**
     * Returns HEX string containing first 32 bytes of Keccak256 hash function
     * applied to the canonical representation of the event signature.
     *
     * @deprecated
     */
    canonicalSignatureHash(encoderVersion: ABIEncoderVersion): string {
        return encodeEventSignature(this.canonicalSignature(encoderVersion));
    }

    /**
     * Returns 32 bytes of event topic hash or `undefined` if event is declared as anonymous.
     */
    eventTopic(encoderVersion: ABIEncoderVersion): string | undefined {
        return this.anonymous ? undefined : this.canonicalSignatureHash(encoderVersion);
    }
}
