import { ContractDefinition } from "../../ast";
import { TypeNode } from "./type";
import { pp, Range } from "../../misc";

/// The type of the `super` keyword. We want a special type since
/// due to multiple inheritance `super.funName` may resolve to different
/// contracts depending on `funName`. So we can't just resolve `super` to
/// the type name of a specific contract.
export class SuperType extends TypeNode {
    contract: ContractDefinition;

    constructor(contract: ContractDefinition, src?: Range) {
        super(src);
        this.contract = contract;
    }

    pp(): string {
        return `super(${pp(this.contract)})`;
    }

    getFields(): any[] {
        return [this.contract.id];
    }
}
