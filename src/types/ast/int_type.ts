import { Range } from "../../misc";
import { TypeNode } from "./type";

export class IntType extends TypeNode {
    nBits: number;
    signed: boolean;

    constructor(nBits: number, signed: boolean, src?: Range) {
        super(src);

        this.nBits = nBits;
        this.signed = signed;
    }

    pp(): string {
        return `${this.signed ? "" : "u"}int${this.nBits}`;
    }

    /// Maximum value (inclusive) representable by this int type.
    max(): bigint {
        return 2n ** BigInt(this.signed ? this.nBits - 1 : this.nBits) - 1n;
    }

    /// Minimum value (inclusive) representable by this int type.
    min(): bigint {
        return this.signed ? -(2n ** BigInt(this.nBits - 1)) : 0n;
    }

    fits(literal: bigint): boolean {
        return literal <= this.max() && literal >= this.min();
    }
}
