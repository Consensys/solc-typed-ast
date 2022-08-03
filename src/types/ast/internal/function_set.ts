import { FunctionDefinition } from "../../../ast";
import { Range } from "../../../misc";
import { TypeNode } from "../type";

/// The type of an expression referring to one (or more in case of overloading)
/// functions.
export class FunctionSetType extends TypeNode {
    public readonly funs: FunctionDefinition[];

    constructor(funs: FunctionDefinition[], src?: Range) {
        super(src);

        this.funs = funs;
    }

    pp(): string {
        return `function_set { ${this.funs.map((fun) => `${fun.name}#${fun.id}`).join(", ")} }`;
    }

    getFields(): any[] {
        return [this.funs.map((fun) => fun.id)];
    }
}
