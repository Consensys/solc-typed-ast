import { ASTNode } from "../ast_node";
import { ASTNodePostprocessor } from "../ast_reader";
import { BuiltinReferencedDeclarationNormalizer } from "./builtin_referenced_declaration_normalizer";
import { StructuredDocumentationReconstructingPostprocessor } from "./structured_documentation_reconstruction";

/**
 * Higher priority value means earlier execution.
 * Do not use same priority values for different node postprocessors
 * (may result unpredictable behavior).
 */
export const DefaultNodePostprocessorList: Array<ASTNodePostprocessor<ASTNode>> = [
    new BuiltinReferencedDeclarationNormalizer(1000),
    new StructuredDocumentationReconstructingPostprocessor(100)
];
