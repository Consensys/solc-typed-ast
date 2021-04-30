import { TypeNode } from "./type";
import { DataLocation } from "../../ast";
import { Range } from "../../misc";

export type PointerKind = "ref" | "pointer" | "slice";

export class PointerType extends TypeNode {
    public readonly to: TypeNode;
    public readonly location: DataLocation;
    public readonly kind?: PointerKind;

    constructor(to: TypeNode, location: DataLocation, kind?: PointerKind, src?: Range) {
        super(src);
        this.to = to;
        this.location = location;
        this.kind = kind;
    }

    pp(): string {
        return `${this.to.pp()} ${this.location}${this.kind !== undefined ? " " + this.kind : ""}`;
    }

    getFields(): any[] {
        return [this.to, this.location];
    }
}
