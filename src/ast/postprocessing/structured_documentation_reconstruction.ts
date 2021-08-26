import { ASTNode } from "../ast_node";
import { ASTContext, ASTNodePostprocessor } from "../ast_reader";
import {
    ContractDefinition,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    ModifierDefinition,
    VariableDeclaration
} from "../implementation/declaration";
import { SourceUnit } from "../implementation/meta/source_unit";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { Statement, StatementWithChildren } from "../implementation/statement/statement";

export class StructuredDocumentationReconstructor {
    process(node: ASTNode, source: string): StructuredDocumentation | undefined {
        const [from, to, sourceIndex] = this.getGapInfo(node);
        const fragment = source.slice(from, to);
        const comments = this.extractComments(fragment);
        const docBlock = comments.length > 0 ? this.detectDocumentationBlock(comments) : undefined;

        if (docBlock === undefined) {
            return undefined;
        }

        const offset = from + fragment.indexOf(docBlock);
        const length = docBlock.length;
        const src = `${offset}:${length}:${sourceIndex}`;
        const text = this.extractText(docBlock);

        return new StructuredDocumentation(0, src, "StructuredDocumentation", text);
    }

    private getGapInfo(node: ASTNode): [number, number, number] {
        const curInfo = node.sourceInfo;
        const to = curInfo.offset;
        const sourceIndex = curInfo.sourceIndex;

        const prev = node.previousSibling;

        let from: number;

        if (prev === undefined) {
            const parent = node.parent;

            if (parent === undefined || parent instanceof SourceUnit) {
                from = 0;
            } else {
                const parentInfo = parent.sourceInfo;

                from = parentInfo.offset;
            }
        } else {
            const prevInfo = prev.sourceInfo;

            from = prevInfo.offset + prevInfo.length;
        }

        return [from, to, sourceIndex];
    }

    private extractComments(fragment: string): string[] {
        const rx = /(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|([^\n\r]*\/\/.*[\n\r]+)|[\n\r]/g;
        const result: string[] = [];

        let match = rx.exec(fragment);

        while (match !== null) {
            result.push(match[0]);

            match = rx.exec(fragment);
        }

        return result;
    }

    private detectDocumentationBlock(comments: string[]): string | undefined {
        const buffer: string[] = [];

        comments.reverse();

        let stopOnNextGap = false;

        for (const comment of comments) {
            if (comment.startsWith("/**")) {
                buffer.push(comment);

                break;
            } else if (comment.trimLeft().startsWith("///")) {
                buffer.push(comment);

                stopOnNextGap = true;
            } else if (stopOnNextGap) {
                break;
            }
        }

        return buffer.length > 0 ? buffer.reverse().join("").trim() : undefined;
    }

    private extractText(docBlock: string): string {
        const result: string[] = [];

        const replacers = docBlock.startsWith("///") ? ["/// ", "///"] : ["/**", "*/", "* ", "*"];

        const lines = docBlock.split("\n");

        for (let line of lines) {
            line = line.trimLeft();

            for (const replacer of replacers) {
                line = line.replace(replacer, "");
            }

            result.push(line);
        }

        return result.join("\n").trim();
    }
}

type SupportedNode =
    | FunctionDefinition
    | ContractDefinition
    | VariableDeclaration
    | ErrorDefinition
    | EventDefinition
    | ModifierDefinition
    | Statement
    | StatementWithChildren<any>;

export class StructuredDocumentationReconstructingPostprocessor
    implements ASTNodePostprocessor<SupportedNode>
{
    private reconstructor = new StructuredDocumentationReconstructor();

    process(node: SupportedNode, context: ASTContext, sources?: Map<string, string>): void {
        if (node.documentation instanceof StructuredDocumentation || sources === undefined) {
            return;
        }

        const root = node.root as SourceUnit;
        const source = sources.get(root.sourceEntryKey);

        if (source === undefined) {
            return;
        }

        const structDocNode = this.reconstructor.process(node, source);

        if (structDocNode === undefined) {
            return;
        }

        structDocNode.id = context.lastId + 1;

        context.register(structDocNode);

        node.documentation = structDocNode;

        structDocNode.parent = node;
    }

    isSupportedNode(node: ASTNode): node is SupportedNode {
        return (
            node instanceof FunctionDefinition ||
            node instanceof ContractDefinition ||
            node instanceof ErrorDefinition ||
            node instanceof EventDefinition ||
            node instanceof ModifierDefinition ||
            (node instanceof VariableDeclaration &&
                (node.parent instanceof ContractDefinition || node.parent instanceof SourceUnit)) ||
            node instanceof Statement ||
            node instanceof StatementWithChildren
        );
    }
}
