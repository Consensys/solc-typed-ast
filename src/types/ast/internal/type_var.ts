import { TypeNode } from "../type";

/**
 * Type Var class. A placeholder for a single type.
 */
export class TVar extends TypeNode {
    constructor(public readonly name: string) {
        super();
    }

    pp(): string {
        return `<TVar ${this.name}>`;
    }
}

/**
 * A placeholder for the remaining types in a function parameter list/tuple.
 * Corresponds to the '...' in abi.decode*
 */
export class TRest extends TypeNode {
    constructor(public readonly name: string) {
        super();
    }

    pp(): string {
        return `<TRest ${this.name}>`;
    }
}
