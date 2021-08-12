import { ASTNode } from "../ast_node";
import { ASTContext } from "../ast_reader";
import { Identifier } from "../implementation/expression/identifier";
import { MemberAccess } from "../implementation/expression/member_access";
import { IdentifierPath } from "../implementation/meta/identifier_path";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { ASTNodePostprocessor } from "./postprocessor";

type SupportedNode = Identifier | MemberAccess | IdentifierPath | UserDefinedTypeName;

export class BuiltinReferencedDeclarationNormalizer extends ASTNodePostprocessor {
    process(node: ASTNode, context: ASTContext): void {
        if (!this.isSupportedNode(node)) {
            throw new Error(`Supplied node "${node.constructor.name}" is not supported`);
        }

        if (
            node.referencedDeclaration >= 0 &&
            context.locate(node.referencedDeclaration) === undefined
        ) {
            node.referencedDeclaration = -1;
        }
    }

    private isSupportedNode(node: ASTNode): node is SupportedNode {
        return (
            node instanceof Identifier ||
            node instanceof MemberAccess ||
            node instanceof IdentifierPath ||
            node instanceof UserDefinedTypeName
        );
    }
}
