import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Break } from "../implementation/statement/break";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyBreakProcessor extends LegacyNodeProcessor<Break> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Break> {
        const [id, src, type] = super.process(reader, config, raw);

        return [id, src, type, undefined, raw];
    }
}
