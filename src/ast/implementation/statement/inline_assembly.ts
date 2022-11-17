import { ASTNode } from "../../ast_node";
import { StructuredDocumentation } from "../meta";
import { YulBlock } from "../yul";
import { Statement } from "./statement";

export interface YulNode {
    nodeType: string;
    src: string;

    [name: string]: any;
}

export class InlineAssembly extends Statement {
    externalReferences: any[];

    operations?: string;
    yul?: YulBlock;

    flags?: string[];
    evmVersion?: string;

    constructor(
        id: number,
        src: string,
        externalReferences: any[],
        operations?: string,
        yul?: YulBlock,
        flags?: string[],
        evmVersion?: string,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.externalReferences = externalReferences;
        this.operations = operations;
        this.yul = yul;
        this.flags = flags;
        this.evmVersion = evmVersion;
        this.acceptChildren();
    }

    get children(): ASTNode[] {
        return this.pickNodes(this.documentation, this.yul);
    }
}
