import Decimal from "decimal.js";
import { Range } from "../../misc";
import { smallestFittingType } from "../utils";
import { IntType } from "./int_type";
import { TypeNode } from "./type";

export class IntLiteralType extends TypeNode {
    /// TODO(dimo): After removing the typestring parser make this required
    /// TODO(dimo): Made a mistake - should revert this to bigint and then
    /// use the rational_literal type to model non-whole numbers.
    /// TODO(dimo): Perhaps use a differnt library other than Decimal that keeps explicit track of
    /// bigint numerator/denominators?
    /// TODO(dimo): Does Solidity allow literal operations that result in infinite fractional numbers? E.g. 2/3 ?
    public readonly literal?: Decimal;

    constructor(literal?: bigint | Decimal, src?: Range) {
        super(src);

        this.literal =
            literal === undefined || literal instanceof Decimal
                ? literal
                : new Decimal(literal.toString());
    }

    negated(): IntLiteralType {
        return new IntLiteralType(this.literal ? this.literal.negated() : this.literal);
    }

    pp(): string {
        if (this.literal && !this.literal.isInt()) {
            const fraction = this.literal.toFraction();
            return `rational_const ${fraction[0]} / ${fraction[1]}`;
        }

        return `int_const${this.literal !== undefined ? ` ${this.literal.toFixed()}` : ""}`;
    }

    /**
     * Find the smallest int type that fits this literal. Return undefined if no such type exists.
     */
    smallestFittingType(): IntType | undefined {
        if (this.literal === undefined) {
            return undefined;
        }

        return smallestFittingType(this.literal);
    }
}
