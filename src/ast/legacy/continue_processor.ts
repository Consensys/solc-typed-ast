import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Continue } from "../implementation/statement/continue";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyContinueProcessor extends LegacyNodeProcessor<Continue> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Continue> {
        const [id, src, type] = super.process(reader, config, raw);

        return [id, src, type, undefined, raw];
    }
}
