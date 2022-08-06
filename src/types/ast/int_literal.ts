import { Range } from "../../misc";
import { smallestFittingType } from "../utils";
import { IntType } from "./int_type";
import { NumericLiteralType } from "./numeric_literal";

export class IntLiteralType extends NumericLiteralType {
    /// TODO(dimo): After removing the typestring parser make this required
    public readonly literal?: bigint;

    constructor(literal?: bigint, src?: Range) {
        super(src);

        this.literal = literal;
    }

    pp(): string {
        return `int_const${this.literal !== undefined ? ` ${this.literal.toString()}` : ""}`;
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
