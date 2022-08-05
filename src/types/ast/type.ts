import { Node } from "../../misc/node";

export abstract class TypeNode extends Node {
    getFields(): any[] {
        return [this.pp()];
    }
}
