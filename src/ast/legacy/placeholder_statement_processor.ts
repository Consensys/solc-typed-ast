import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { PlaceholderStatement } from "../implementation/statement/placeholder_statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyPlaceholderStatementProcessor extends LegacyNodeProcessor<PlaceholderStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof PlaceholderStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        return [id, src, type, undefined, raw];
    }
}
