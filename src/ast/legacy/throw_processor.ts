import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Throw } from "../implementation/statement/throw";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyThrowProcessor extends LegacyNodeProcessor<Throw> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Throw> {
        const [id, src] = super.process(reader, config, raw);

        return [id, src, undefined, raw];
    }
}
