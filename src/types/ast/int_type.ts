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

    getFields(): any[] {
        return [this.nBits, this.signed];
    }
}
