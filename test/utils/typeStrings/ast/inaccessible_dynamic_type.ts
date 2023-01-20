import { TypeNode } from "../../../../src";

/**
 * Place-holder type used only by the typestring parser for
 * cases when the typestring contains "inaccessible dynamic type".
 */
export class InaccessibleDynamicType extends TypeNode {
    pp(): string {
        return "inaccessible_dynamic_type";
    }
}
