import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { ASTNodeProcessor, ASTReader, ASTReaderConfiguration } from "../ast_reader";

export class ModernNodeProcessor<T extends ASTNode> implements ASTNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ASTNodeConstructor<T>> {
        return [raw.id, raw.src, raw.nodeType, undefined, raw];
    }
}
