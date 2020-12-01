import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { YulNode } from "../implementation/statement/inline_assembly";
import { SourceFormatter } from "./formatter";

export interface YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string;
}

export interface ASTNodeWriter {
    write(node: ASTNode, writer: ASTWriter): string;
}

export class YulWriter {
    mapping: Map<string, YulNodeWriter>;
    formatter: SourceFormatter;

    constructor(mapping: Map<string, YulNodeWriter>, formatter: SourceFormatter) {
        this.mapping = mapping;
        this.formatter = formatter;
    }

    write(node: YulNode): string {
        const writer = this.mapping.get(node.nodeType);

        if (writer) {
            return writer.write(node, this);
        }

        const data = JSON.stringify(node, undefined, 4);

        throw new Error("Unable to find writer for Yul node: " + data);
    }
}

export class ASTWriter {
    mapping: Map<ASTNodeConstructor<ASTNode>, ASTNodeWriter>;
    formatter: SourceFormatter;
    targetCompilerVersion: string;

    constructor(
        mapping: Map<ASTNodeConstructor<ASTNode>, ASTNodeWriter>,
        formatter: SourceFormatter,
        targetCompilerVersion: string
    ) {
        this.mapping = mapping;
        this.formatter = formatter;
        this.targetCompilerVersion = targetCompilerVersion;
    }

    write(node: ASTNode): string {
        const writer = this.mapping.get(node.constructor as ASTNodeConstructor<ASTNode>);

        if (writer) {
            return writer.write(node, this);
        }

        if (node instanceof ASTNode) {
            throw new Error("Unable to find writer for AST node: " + node.print());
        }

        const data = JSON.stringify(node, undefined, 4);

        throw new Error("Expected an instance of ASTNode but got following: " + data);
    }
}
