import { YulLiteralKind } from "../../../constants";
import { YulExpression } from "./yul_expression";

export class YulLiteral extends YulExpression {
    /**
     * The type of literal: `number`, `string` or `bool`
     */
    kind: YulLiteralKind;

    /**
     * Hexadecimal representation of value of the literal symbol
     */
    hexValue: string;

    /**
     * Value of the literal symbol
     */
    value: string;

    /**
     * Yul type string, e.g.u256
     */
    typeString: string;

    constructor(
        id: number,
        src: string,
        kind: YulLiteralKind,
        value: string,
        hexValue: string,
        typeString = "",
        raw?: any
    ) {
        super(id, src, raw);

        this.kind = kind;
        this.value = value;
        this.hexValue = hexValue;
        this.typeString = typeString;
    }
}
