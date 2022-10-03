import { Range } from "../../misc";
import { NumericLiteralType } from "./numeric_literal";

export interface Rational {
    numerator: bigint;
    denominator: bigint;
}

export class RationalLiteralType extends NumericLiteralType {
    readonly literal: Rational;

    constructor(literal: Rational, src?: Range) {
        super(src);

        this.literal = literal;
    }

    pp(): string {
        const { numerator, denominator } = this.literal;

        return `rational_const ${numerator.toString()} / ${denominator.toString()}`;
    }
}
