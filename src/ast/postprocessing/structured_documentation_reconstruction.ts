import { ASTNode } from "../ast_node";
import { ASTContext, ASTNodePostprocessor } from "../ast_reader";
import {
    ContractDefinition,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    ModifierDefinition,
    StructDefinition,
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
        coords: FragmentCoordinates,
        source: string
    ): StructuredDocumentation | undefined {
        const [from, to, sourceIndex] = coords;
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

        let from = curInfo.offset;

        if (lastChild) {
            const lastChildInfo = lastChild.sourceInfo;

            if (lastChildInfo.offset > curInfo.offset) {
                from = lastChildInfo.offset + lastChildInfo.length;
            }
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

        const rxCleanBeforeSlash = /^[^/]+/;

        for (const comment of comments) {
            /**
             * Remove ANY leading characters before first `/` character.
             *
             * This is mostly actual for dangling documentation candidates,
             * as their source range starts from very beginnig of parent node.
             * This leads to an effect that part of parent source symbols are
             * preceding the `///` or `/**`. Skip them for detection reasons.
             *
             * Consider following example:
             * ```
             * unchecked {
             *     /// dangling
             * }
             * ```
             * Source range would include the `unchecked {` part,
             * however interesting part for us starts only since `///`.
             */
            const cleanComment = comment.replace(rxCleanBeforeSlash, "");

            /**
             * Consider if comment is valid single-line or multi-line DocBlock
             */
            if (cleanComment.startsWith("/**")) {
                buffer.push(comment);

                break;
            } else if (cleanComment.startsWith("///")) {
                buffer.push(comment);

                stopOnNextGap = true;
            } else if (stopOnNextGap) {
                break;
            }
        }

        if (buffer.length === 0) {
            return undefined;
        }

        if (buffer.length > 1) {
            buffer.reverse();
        }

        /**
         * When joining back DocBlock, remove leading garbage characters again,
         * but only before first `/` (not in each line, like before).
         *
         * Need to preserve whitespace charactes in multiline comments like
         * ```
         * {
         *      /// A
         *          /// B
         *              /// C
         * }
         * ```
         * to have following result
         * ```
         * /// A
         *          /// B
         *              /// C
         * ```
         * NOTE that this is affecting documentation node source range.
         */
        return buffer.join("").trim().replace(rxCleanBeforeSlash, "");
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
    | EnumDefinition
    | StructDefinition
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

                preceding.parent = node;
            }
        }

        /**
         * Dangling structured documentation can currently be added to
         * Statements, ContractDefinitions, EnumDefinitions and
         * StructDefinitions
         */
        if (
            node instanceof StatementWithChildren ||
            node instanceof ContractDefinition ||
            node instanceof EnumDefinition ||
            node instanceof StructDefinition
        ) {
            const danglingGap = this.reconstructor.getDanglingGapCoordinates(node);
            const dangling = this.reconstructor.fragmentCoordsToStructDoc(danglingGap, source);

            if (dangling) {
                dangling.id = context.lastId + 1;

                context.register(dangling);

                node.danglingDocumentation = dangling;

                dangling.parent = node;
            }
        }
    }

    isSupportedNode(node: ASTNode): node is SupportedNode {
        return (
            node instanceof FunctionDefinition ||
            node instanceof ContractDefinition ||
            node instanceof EnumDefinition ||
            node instanceof StructDefinition ||
            node instanceof ErrorDefinition ||
            node instanceof EventDefinition ||
            node instanceof ModifierDefinition ||
            (node instanceof VariableDeclaration &&
                (node.parent instanceof ContractDefinition ||
                    node.parent instanceof SourceUnit ||
                    node.parent instanceof StructDefinition)) ||
            node instanceof Statement ||
            node instanceof StatementWithChildren
        );
    }
}
