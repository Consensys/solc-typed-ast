import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { ASTContext } from "../ast_reader";
import { DefaultPostprocessorMapping } from "./mapping";

export abstract class ASTNodePostprocessor {
    readonly priority: number;

    constructor(priority: number) {
        this.priority = priority;
    }

    abstract process(node: ASTNode, context: ASTContext, sources?: Map<string, string>): void;
}

export class ASTPostprocessor {
    mapping: Map<ASTNodeConstructor<ASTNode>, ASTNodePostprocessor[]>;

    constructor(mapping = DefaultPostprocessorMapping) {
        this.mapping = mapping;
    }

    getPostprocessorsForNode(node: ASTNode): ASTNodePostprocessor[] | undefined {
        return this.mapping.get(node.constructor as ASTNodeConstructor<ASTNode>);
    }

    processNode(node: ASTNode, context: ASTContext, sources?: Map<string, string>): void {
        const postprocessors = this.getPostprocessorsForNode(node);

        if (postprocessors) {
            for (const postprocessor of postprocessors) {
                postprocessor.process(node, context, sources);
            }
        }
    }

    processContext(context: ASTContext, sources?: Map<string, string>): void {
        const groupsByPriority = new Map<number, ASTNode[]>();

        for (const node of context.nodes) {
            const postprocessors = this.getPostprocessorsForNode(node);

            if (postprocessors) {
                for (const postprocessor of postprocessors) {
                    const priority = postprocessor.priority;
                    const group = groupsByPriority.get(priority);

                    if (group) {
                        group.push(node);
                    } else {
                        groupsByPriority.set(priority, [node]);
                    }
                }
            }
        }

        const groups = Array.from(groupsByPriority)
            .sort((a, b) => a[0] - b[0])
            .map((entry) => entry[1]);

        for (const nodes of groups) {
            for (const node of nodes) {
                this.processNode(node, context, sources);
            }
        }
    }
}
