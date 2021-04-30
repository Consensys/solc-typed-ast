import { TypeNode } from "./type";
import { FunctionVisibility, FunctionStateMutability } from "../../ast";
import { Range } from "../../misc";

export class FunctionType extends TypeNode {
    /**
     * The type for external functions includes the name, as its used for
     * computing the canonical signature.
     */
    public readonly name: string | undefined;
    public readonly parameters: TypeNode[];
    public readonly returns: TypeNode[];
    public readonly visibility: FunctionVisibility;
    public readonly mutability: FunctionStateMutability;

    constructor(
        name: string | undefined,
        parameters: TypeNode[],
        returns: TypeNode[],
        visibility: FunctionVisibility,
        mutability: FunctionStateMutability,
        src?: Range
    ) {
        super(src);
        this.name = name;
        this.parameters = parameters;
        this.returns = returns;
        this.visibility = visibility;
        this.mutability = mutability;
    }

    pp(): string {
        const argStr = this.parameters.map((paramT) => paramT.pp()).join(",");
        let retStr = this.returns.map((paramT) => paramT.pp()).join(",");
        retStr = retStr !== "" ? ` returns (${retStr})` : retStr;

        const visStr = this.visibility !== FunctionVisibility.Internal ? ` ` + this.visibility : "";
        const mutStr = this.mutability !== "nonpayable" ? " " + this.mutability : "";

        return `function ${
            this.name !== undefined ? this.name : ""
        }(${argStr})${mutStr}${visStr}${retStr}`;
    }

    getFields(): any[] {
        return [this.parameters, this.returns, this.visibility, this.mutability];
    }
}
