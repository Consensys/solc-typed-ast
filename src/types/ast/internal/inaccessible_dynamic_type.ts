import { TypeNode } from "../type";

/**
 * Place-holder type used only by the typestring parser for
 * cases when the typestring contains "inaccessible dynamic type".
 * @todo move under test/ along with typestring parser
 */
export class InaccessibleDynamicType extends TypeNode {
    pp(): string {
        return "inaccessible_dynamic_type";
    }
}
