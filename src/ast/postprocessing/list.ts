import { ASTNode } from "../ast_node";
import { ASTNodePostprocessor } from "../ast_reader";
import { BuiltinReferencedDeclarationNormalizer } from "./builtin_referenced_declaration_normalizer";
import { StructuredDocumentationReconstructingPostprocessor } from "./structured_documentation_reconstruction";

/**
 * Note that order here really matters
 */
export const DefaultNodePostprocessorList: Array<ASTNodePostprocessor<ASTNode>> = [
    new BuiltinReferencedDeclarationNormalizer(),
    new StructuredDocumentationReconstructingPostprocessor()
];
