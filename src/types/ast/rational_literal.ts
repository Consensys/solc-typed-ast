import { Range } from "../../misc";
import { TypeNode } from "./type";

interface Rational {
  numerator: bigint;
  denominator: bigint;
}

export class RationalLiteralType extends TypeNode {
    public readonly literal: Rational;

    constructor(literal: Rational, src?: Range) {
        super(src);

        this.literal = literal;
    }

    pp(): string {
        return `rational_const ${ppRational(this.literal)}`;
    }

    getFields(): any[] {
        return [this.literal];
    }
}

function ppRational(literal: Rational): string {
  return `${literal.numerator.toString()} / ${literal.denominator.toString()}`;
}
