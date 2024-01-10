import { strByteLen, toUTF8 } from "../../misc";
import { ASTNode } from "../ast_node";
import { ASTContext, ASTNodePostprocessor, FileMap } from "../ast_reader";
import { parseComments } from "../comments";
import { RawCommentKind } from "../constants";
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

/**
 * When we are looking at a fragment between the start of a parent node and its
 * first child, there may be some non-empty garbage at the start from the opening text
 * of the parent. We use these regexes to remove those
 */
const skip = [
    /^\s*;\s*else\s*/, // skip ; else ___ (due to a bug in 0.4.x compilers)
    /^\s*}\s*else\s*/, // skip } else ___ (due to a bug in 0.4.x compilers)
    /^\s*;\s*;\s*\)/, // skip __;__;__)
    /^\s*;\s*\)/, // skip __;__)
    /^\s*;\s*;/, // skip __;
    /^\s*;/, // skip __;
    /^\s*for\s*\(\s*;\s*;\s*\)/, // skip ____;
    /^\s*for\s*\(\s*;\s*;/, // skip ____;
    /^\s*{/, // skip ____{
    /^\s*\)/, // skip ____ )
    /^\s*for\s*\(\s*/, // skip for __ ( __
    /^\s*else\s*/, // skip else ___
    /^\s*catch\s*/, // skip else ___
    /^[^{]*{/ // skip contract/interfae/struct/unchecked/library ... {
];

export class StructuredDocumentationReconstructor {
    // Skip any ), ; or { at the begining of a fragment
    computeSkip(s: string): number {
        for (const rx of skip) {
            const m = s.match(rx);

            if (m) {
                return m[0].length;
            }
        }

        return 0;
    }

    /**
     * Extracts fragment at provided source location,
     * then tries to find documentation and construct dummy `StructuredDocumentation`.
     * Returns produced `StructuredDocumentation` on success or `undefined`
     * if documentation was not detected in extracted fragment.
     */
    fragmentCoordsToStructDoc(
        coords: FragmentCoordinates,
        source: Uint8Array
    ): StructuredDocumentation | undefined {
        const [from, to, sourceIndex] = coords;
        const fragment = toUTF8(source.slice(from, to));

        const skip = this.computeSkip(fragment);
        const skippedFragment = fragment.slice(skip);
        const parsedComments = parseComments(skippedFragment);

        // No comments found in the game
        if (parsedComments.length === 0) {
            return undefined;
        }

        const lastComment = parsedComments[parsedComments.length - 1];

        // The last comment in the gap is not a docstring
        if (
            lastComment.kind !== RawCommentKind.BlockNatSpec &&
            lastComment.kind !== RawCommentKind.LineGroupNatSpec
        ) {
            return undefined;
        }

        const byteOffsetFromFragment = strByteLen(fragment.slice(0, skip + lastComment.loc.start));
        const offset = from + byteOffsetFromFragment;
        const length = strByteLen(lastComment.text);
        const src = `${offset}:${length}:${sourceIndex}`;

        return new StructuredDocumentation(0, src, lastComment.internalText.trim());
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

        // Skip final }
        const to = curInfo.offset + curInfo.length - 1;
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
    | StatementWithChildren<ASTNode>;

export class StructuredDocumentationReconstructingPostprocessor
    implements ASTNodePostprocessor<SupportedNode>
{
    private reconstructor = new StructuredDocumentationReconstructor();

    process(node: SupportedNode, context: ASTContext, sources?: FileMap): void {
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
