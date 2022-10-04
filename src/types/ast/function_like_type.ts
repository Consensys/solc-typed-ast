import { TypeNode } from "./type";
import { Range } from "../../misc";

/**
 * Abstract base class for all "function-like" AST nodes. This includes
 * function names, function pointers, event/error modifier name as well
 * as references to some of the builtins
 */
export abstract class FunctionLikeType extends TypeNode {
    public readonly name: string | undefined;
    public readonly parameters: TypeNode[];

    constructor(name: string | undefined, parameters: TypeNode[], src?: Range) {
        super(src);
        this.name = name;
        this.parameters = parameters;
    }
}
