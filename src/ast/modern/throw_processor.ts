import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Throw } from "../implementation/statement/throw";
import { ModernNodeProcessor } from "./node_processor";

export class ModernThrowProcessor extends ModernNodeProcessor<Throw> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Throw> {
        const [id, src, type] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        return [id, src, type, documentation, raw];
    }
}
