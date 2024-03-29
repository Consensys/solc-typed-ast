import { FunctionStateMutability, FunctionVisibility } from "../../ast";
import { Range } from "../../misc";
import { Node } from "../../misc/node";
import { FunctionLikeType } from "./function_like_type";
import { TypeNode } from "./type";

export class FunctionType extends FunctionLikeType {
    /**
     * The type for external functions includes the name,
     * as its used for computing the canonical signature.
     */
    public readonly returns: TypeNode[];
    public visibility: FunctionVisibility;
    public readonly mutability: FunctionStateMutability;
    /**
     * If this function type corresponds to a library function
     * bound to a type with a `using for` directive, the first
     * argument is implicitly the object on which the function is invoked.
     */
    public readonly implicitFirstArg: boolean;

    constructor(
        name: string | undefined,
        parameters: TypeNode[],
        returns: TypeNode[],
        visibility: FunctionVisibility,
        mutability: FunctionStateMutability,
        implicitFirstArg = false,
        src?: Range
    ) {
        super(name, parameters, src);

        this.returns = returns;
        this.visibility = visibility;
        this.mutability = mutability;
        this.implicitFirstArg = implicitFirstArg;
    }

    getChildren(): Node[] {
        return [...this.parameters, ...this.returns];
    }

    pp(): string {
        const mapper = (node: TypeNode) => node.pp();

        const argStr = this.parameters.map(mapper).join(",");

        let retStr = this.returns.map(mapper).join(",");

        retStr = retStr !== "" ? ` returns (${retStr})` : retStr;

        const visStr =
            this.visibility !== FunctionVisibility.Internal &&
            this.visibility !== FunctionVisibility.Default
                ? ` ` + this.visibility
                : "";
        const mutStr = this.mutability !== "nonpayable" ? " " + this.mutability : "";

        return `function ${
            this.name !== undefined ? this.name : ""
        }(${argStr})${mutStr}${visStr}${retStr}`;
    }
}
