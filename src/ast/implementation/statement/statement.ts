import { ASTNode, ASTNodeWithChildren } from "../../ast_node";

export class Statement extends ASTNode {}

export class StatementWithChildren<T extends ASTNode> extends ASTNodeWithChildren<T> {}
