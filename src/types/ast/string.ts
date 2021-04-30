import { PackedArrayType } from "./packed_array_type";

export class StringType extends PackedArrayType {
    pp(): string {
        return "string";
    }
}
