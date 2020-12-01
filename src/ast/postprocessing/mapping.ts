import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { ASTNodePostprocessor } from "../ast_reader";
import { ContractDefinition } from "../implementation/declaration/contract_definition";
import { EventDefinition } from "../implementation/declaration/event_definition";
import { FunctionDefinition } from "../implementation/declaration/function_definition";
import { ModifierDefinition } from "../implementation/declaration/modifier_definition";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { StructuredDocumentationReconstructingPostprocessor } from "./structured_documentation_reconstruction";

const reconstructor = new StructuredDocumentationReconstructingPostprocessor();

export const DefaultPostprocessorMapping = new Map<
    ASTNodeConstructor<ASTNode>,
    ASTNodePostprocessor[]
>([
    [ContractDefinition, [reconstructor]],
    [EventDefinition, [reconstructor]],
    [FunctionDefinition, [reconstructor]],
    [ModifierDefinition, [reconstructor]],
    [VariableDeclaration, [reconstructor]]
]);
