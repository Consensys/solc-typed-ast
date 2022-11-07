import { YulExpression } from "./yul_expression";

export class YulTypedName extends YulExpression {
    /**
     * Name of the identifier
     */
    name: string;

    /**
     * Yul type string, e.g.u256
     */
    typeString: string;

    constructor(id: number, src: string, name: string, typeString = "", raw?: any) {
        super(id, src, raw);

        this.name = name;
        this.typeString = typeString;
    }
}
