import { ASTNode } from "../ast_node";
import { ASTContext, ASTNodePostprocessor } from "../ast_reader";

export abstract class NodePostprocessor implements ASTNodePostprocessor {
    readonly priority: number;

    constructor(priority: number) {
        this.priority = priority;
    }

    abstract process(node: ASTNode, context: ASTContext, sources?: Map<string, string>): void;
}
