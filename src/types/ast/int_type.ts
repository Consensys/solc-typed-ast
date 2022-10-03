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
        return BigInt(2) ** BigInt(this.signed ? this.nBits - 1 : this.nBits) - BigInt(1);
    }

    /// Minimum value (inclusive) representable by this int type.
    min(): bigint {
        return this.signed ? -(BigInt(2) ** BigInt(this.nBits - 1)) : BigInt(0);
    }

    fits(literal: bigint): boolean {
        return literal <= this.max() && literal >= this.min();
    }
}
