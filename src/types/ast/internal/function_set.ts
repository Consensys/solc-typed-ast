import { FunctionDefinition } from "../../../ast";
import { Range } from "../../../misc";
import { BuiltinFunctionType } from "../builtin_function";
import { EventType } from "../event_type";
import { FunctionType } from "../function_type";
import { TypeNode } from "../type";

export type FunctionSetType = FunctionLikeSetType<FunctionType | BuiltinFunctionType>;

/// The type of an expression referring to one (or more in case of overloading)
/// functions.
export class FunctionLikeSetType<
    T extends FunctionType | EventType | BuiltinFunctionType
> extends TypeNode {
    public readonly defs: T[];

    constructor(funs: T[], src?: Range) {
        super(src);

        this.defs = funs;
    }

    pp(): string {
        const setType = this.defs[0] instanceof FunctionDefinition ? "function_set" : "event_set";
        return `${setType} { ${this.defs.map((fun) => `${fun.name}#${fun.id}`).join(", ")} }`;
    }

    getFields(): any[] {
        return this.defs;
    }
}
