import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { PlaceholderStatement } from "../implementation/statement/placeholder_statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernPlaceholderStatementProcessor extends ModernNodeProcessor<PlaceholderStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof PlaceholderStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        return [id, src, type, documentation, raw];
    }
}
