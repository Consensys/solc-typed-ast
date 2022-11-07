import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBlock, YulStatement } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulBlockProcessor extends ModernNodeProcessor<YulBlock> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulBlock> {
        const [id, src] = super.process(reader, config, raw);

        const statements = reader.convertArray(raw.statements, config) as YulStatement[];

        return [id, src, statements, undefined, raw];
    }
}
