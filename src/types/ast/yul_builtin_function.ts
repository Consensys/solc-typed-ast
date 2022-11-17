import { FunctionLikeType } from "./function_like_type";
import { TypeNode } from "./type";
import { Range } from "../../misc";

/**
 * The type of a yul builtin function
 */
export class YulBuiltinFunctionType extends FunctionLikeType {
    returns: TypeNode[];

    isPure: boolean;

    constructor(
        name: string | undefined,
        parameters: TypeNode[],
        returns: TypeNode[],
        isPure = true,
        src?: Range
    ) {
        super(name, parameters, src);
        this.returns = returns;
        this.isPure = Boolean(isPure);
    }

    pp(): string {
        const mapper = (node: TypeNode) => node.pp();

        const argStr = this.parameters.map(mapper).join(",");

        let retStr = this.returns.map(mapper).join(",");

        retStr = retStr !== "" ? ` -> ${retStr}` : retStr;

        return `yul_builtin_function ${
            this.name !== undefined ? this.name : ""
        }(${argStr})${retStr}`;
    }

    getChildren(): TypeNode[] {
        return [...this.parameters, ...this.returns];
    }
}
