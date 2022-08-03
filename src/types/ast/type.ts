import { Node } from "../../misc/node";

export abstract class TypeNode extends Node {
    typeString(): string {
        return this.pp();
    }
}
