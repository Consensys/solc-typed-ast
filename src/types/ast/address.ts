import { TypeNode } from "./type";
import { Range } from "../../misc";

export class AddressType extends TypeNode {
    payable: boolean;

    constructor(payable: boolean, src?: Range) {
        super(src);

        this.payable = payable;
    }

    pp(): string {
        return `address${this.payable ? " payable" : ""}`;
    }
}
