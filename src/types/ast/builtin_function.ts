import { FunctionLikeType } from "./function_like_type";
import { TypeNode } from "./type";
import { Range } from "../../misc";

/**
 * The type of a builtin function
 */
export class BuiltinFunctionType extends FunctionLikeType {
    returns: TypeNode[];

    constructor(
        name: string | undefined,
        parameters: TypeNode[],
        returns: TypeNode[],
        src?: Range
    ) {
        super(name, parameters, src);
        this.returns = returns;
    }

    pp(): string {
        const mapper = (node: TypeNode) => node.pp();

        const argStr = this.parameters.map(mapper).join(",");

        let retStr = this.returns.map(mapper).join(",");

        retStr = retStr !== "" ? ` returns (${retStr})` : retStr;

        return `builtin_function ${this.name !== undefined ? this.name : ""}(${argStr})${retStr}`;
    }
}
