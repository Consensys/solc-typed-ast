import { Statement } from "./statement";

export interface YulNode {
    nodeType: string;
    src: string;

    [name: string]: any;
}

export class InlineAssembly extends Statement {
    externalReferences: any[];

    operations?: string;
    yul?: YulNode;

    constructor(
        id: number,
        src: string,
        type: string,
        externalReferences: any[],
        operations?: string,
        yul?: YulNode,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.externalReferences = externalReferences;
        this.operations = operations;
        this.yul = yul;
    }
}
