import { ASTNode, ASTNodeWithChildren } from "../ast_node";
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

type FragmentCoordinates = [number, number, number];

export class StructuredDocumentationReconstructor {
    /**
     * Extracts fragment at provided source location,
     * then tries to find documentation and construct dummy `StructuredDocumentation`.
     * Returns produced `StructuredDocumentation` on success or `undefined`
     * if documentation was not detected in extracted fragment.
     */
    fragmentCoordsToStructDoc(
        fragmentCoords: FragmentCoordinates,
        source: string
    ): StructuredDocumentation | undefined {
        const [from, to, sourceIndex] = fragmentCoords;
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

        return new StructuredDocumentation(0, src, text);
    }

    getPrecedingGapCoordinates(node: ASTNode): FragmentCoordinates {
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

    getDanglingGapCoordinates(node: ASTNode): FragmentCoordinates {
        const curInfo = node.sourceInfo;

        const to = curInfo.offset + curInfo.length;
        const sourceIndex = curInfo.sourceIndex;

        const lastChild = node.lastChild;

        let from: number;

        if (lastChild === undefined) {
            from = curInfo.offset;
        } else {
            const lastChildInfo = lastChild.sourceInfo;

            from = lastChildInfo.offset + lastChildInfo.length;
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
            } else if (comment.trimStart().startsWith("///")) {
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
            line = line.trimStart();

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
        if (sources === undefined) {
            return;
        }

        const root = node.root as SourceUnit;
        const source = sources.get(root.sourceEntryKey);

        if (source === undefined) {
            return;
        }

        /**
         * Skip reconstructing preceding strcutured documentation
         * when related fields is already an instance of StructuredDocumentation.
         */
        if (!(node.documentation instanceof StructuredDocumentation)) {
            const precedingGap = this.reconstructor.getPrecedingGapCoordinates(node);
            const preceding = this.reconstructor.fragmentCoordsToStructDoc(precedingGap, source);

            if (preceding) {
                preceding.id = context.lastId + 1;

                context.register(preceding);

                node.documentation = preceding;

                if (preceding.parent !== node) {
                    preceding.parent = node;
                }
            }
        }

        /**
         * Dangling structured documentation can only be located in statements,
         * that may have nested children (`Block` or `UncheckedBlock`).
         */
        if (node instanceof ASTNodeWithChildren) {
            const danglingGap = this.reconstructor.getDanglingGapCoordinates(node);
            const dangling = this.reconstructor.fragmentCoordsToStructDoc(danglingGap, source);

            if (dangling) {
                dangling.id = context.lastId + 1;

                context.register(dangling);

                node.danglingDocumentation = dangling;

                if (dangling.parent !== node) {
                    dangling.parent = node;
                }
            }
        }
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
