import { ASTNode } from "../ast_node";
import { ASTContext, ASTNodePostprocessor } from "../ast_reader";

export abstract class NodePostprocessor<T extends ASTNode> implements ASTNodePostprocessor<T> {
    readonly priority: number;

    constructor(priority: number) {
        this.priority = priority;
    }

    abstract process(node: T, context: ASTContext, sources?: Map<string, string>): void;
    abstract isSupportedNode(node: ASTNode): node is T;
}
