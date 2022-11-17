import { Range } from "../../misc";
import { TypeNode } from "./type";

/**
 * 256 bit native type of the EVM. It is the default (only, as of writing) type in yul,
 * representing a value on the stack. Identical to uint256 in solidity.
 */
export class U256Type extends TypeNode {
    constructor(src?: Range) {
        super(src);
    }

    pp(): string {
        return `u256`;
    }
}
