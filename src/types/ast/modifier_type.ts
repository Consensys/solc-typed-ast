import { FunctionLikeType } from "./function_like_type";
import { TypeNode } from "./type";

/**
 * The type of an identifier referring to a modifier inside of a
 * `ModifierInvocation` node.
 */
export class ModifierType extends FunctionLikeType {
    constructor(name: string, parameters: TypeNode[]) {
        super(name, parameters);
    }

    pp(): string {
        return `modifier ${this.name}(${this.parameters.map((t) => t.pp()).join(",")})`;
    }
}
