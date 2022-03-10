import { Range } from "../../misc";
import { TypeNode } from "./type";

interface Rational {
    numerator: bigint;
    denominator: bigint;
}

export class RationalLiteralType extends TypeNode {
    readonly literal: Rational;

    constructor(literal: Rational, src?: Range) {
        super(src);

        this.literal = literal;
    }

    pp(): string {
        const { numerator, denominator } = this.literal;

        return `rational_const ${numerator.toString()} / ${denominator.toString()}`;
    }

    getFields(): any[] {
        return [this.literal];
    }
}
