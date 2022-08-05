import Decimal from "decimal.js";
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

    max(): bigint {
        return BigInt(2) ** BigInt(this.signed ? this.nBits : this.nBits - 1) - BigInt(1);
    }

    min(): bigint {
        return this.signed ? BigInt(0) : -(BigInt(2) ** BigInt(this.nBits - 1));
    }

    fits(literal: Decimal): boolean {
        return (
            literal.isInt() &&
            literal.greaterThanOrEqualTo(new Decimal(this.min().toString())) &&
            literal.lessThanOrEqualTo(new Decimal(this.max().toString()))
        );
    }
}
