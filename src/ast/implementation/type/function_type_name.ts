import { ASTNode } from "../../ast_node";
import { FunctionStateMutability, FunctionVisibility } from "../../constants";
import { ParameterList } from "../meta/parameter_list";
import { TypeName } from "./type_name";

export class FunctionTypeName extends TypeName {
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
     * A list of local variables that are declared and initialized with the input values
     */
    vParameterTypes: ParameterList;

    /**
     * A list of local variables that are declared and returned to the caller
     */
    vReturnParameterTypes: ParameterList;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        visibility: FunctionVisibility,
        stateMutability: FunctionStateMutability,
        parameterTypes: ParameterList,
        returnParameterTypes: ParameterList,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.visibility = visibility;
        this.stateMutability = stateMutability;

        this.vParameterTypes = parameterTypes;
        this.vReturnParameterTypes = returnParameterTypes;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vParameterTypes, this.vReturnParameterTypes);
    }
}
