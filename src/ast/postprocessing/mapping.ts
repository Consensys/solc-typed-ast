import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { ASTNodePostprocessor } from "../ast_reader";
import { ContractDefinition } from "../implementation/declaration/contract_definition";
import { EventDefinition } from "../implementation/declaration/event_definition";
import { FunctionDefinition } from "../implementation/declaration/function_definition";
import { ModifierDefinition } from "../implementation/declaration/modifier_definition";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Identifier } from "../implementation/expression/identifier";
import { MemberAccess } from "../implementation/expression/member_access";
import { IdentifierPath } from "../implementation/meta/identifier_path";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { BuiltinReferencedDeclarationNormalizer } from "./builtin_referenced_declaration_normalizer";
import { StructuredDocumentationReconstructingPostprocessor } from "./structured_documentation_reconstruction";

const reconstructor = new StructuredDocumentationReconstructingPostprocessor(1000);
const refNormalizer = new BuiltinReferencedDeclarationNormalizer(100);

function sortByPriority(a: ASTNodePostprocessor, b: ASTNodePostprocessor): number {
    return a.priority - b.priority;
}

export const DefaultPostprocessorMapping = new Map<
    ASTNodeConstructor<ASTNode>,
    ASTNodePostprocessor[]
>([
    [ContractDefinition, [reconstructor].sort(sortByPriority)],
    [EventDefinition, [reconstructor].sort(sortByPriority)],
    [FunctionDefinition, [reconstructor].sort(sortByPriority)],
    [ModifierDefinition, [reconstructor].sort(sortByPriority)],
    [VariableDeclaration, [reconstructor].sort(sortByPriority)],

    [Identifier, [refNormalizer].sort(sortByPriority)],
    [MemberAccess, [refNormalizer].sort(sortByPriority)],
    [IdentifierPath, [refNormalizer].sort(sortByPriority)],
    [UserDefinedTypeName, [refNormalizer].sort(sortByPriority)]
]);
