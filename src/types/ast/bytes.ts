import { PackedArrayType } from "./packed_array_type";

export class BytesType extends PackedArrayType {
    pp(): string {
        return "bytes";
    }
}
