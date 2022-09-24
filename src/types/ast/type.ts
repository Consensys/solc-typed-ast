import { Node } from "../../misc/node";

export type TypeNodeConstructor<T extends TypeNode> = new (...args: any) => T;

export abstract class TypeNode extends Node {
    getFields(): any[] {
        return [this.pp()];
    }
}
