import { EtherUnit, LiteralKind, TimeUnit } from "../../constants";
import { PrimaryExpression } from "./primary_expression";

export class Literal extends PrimaryExpression {
    /**
     * The type of literal: `number`, `string`, `bool`, `hexString` or `unicodeString`.
     */
    kind: LiteralKind;

    /**
     * Hexadecimal representation of value of the literal symbol
     */
    hexValue: string;

    /**
     * Value of the literal symbol
     */
    value: string;

    /**
     * The denomination number literal when explicitly specified.
     *
     * Possible values for time: `seconds`, `minutes`, `hours`, `days` or `weeks`
     * (also `years` for Solidity 0.4.x).
     *
     * Possible values for ether: `wei`, `gwei` or `ether`
     * (also `finney` and `szabo` prior to Solidity 0.7.0).
     */
    subdenomination?: TimeUnit | EtherUnit;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        kind: LiteralKind,
        hexValue: string,
        value: string,
        subdenomination?: TimeUnit | EtherUnit,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.kind = kind;
        this.hexValue = hexValue;
        this.value = value;
        this.subdenomination = subdenomination;
    }
}
