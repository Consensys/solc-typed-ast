import { FunctionLikeType } from "./function_like_type";
import { TypeNode } from "./type";

/**
 * The type of an event (e.g. an identifier referring to an event) is a special
 * case of a pure function with no returns
 */
export class ErrorType extends FunctionLikeType {
    constructor(name: string, parameters: TypeNode[]) {
        super(name, parameters);
    }

    pp(): string {
        return `error ${this.name}(${this.parameters.map((t) => t.pp()).join(",")})`;
    }
}
