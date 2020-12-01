import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { ASTNodeProcessor, ASTReader, ASTReaderConfiguration } from "../ast_reader";

export class LegacyNodeProcessor<T extends ASTNode> implements ASTNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ASTNodeConstructor<T>> {
        return [raw.id, raw.src, raw.name, raw];
    }
}
