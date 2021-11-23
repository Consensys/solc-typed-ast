import { StructuredDocumentation } from "../meta";
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
        externalReferences: any[],
        operations?: string,
        yul?: YulNode,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.externalReferences = externalReferences;
        this.operations = operations;
        this.yul = yul;
    }
}
