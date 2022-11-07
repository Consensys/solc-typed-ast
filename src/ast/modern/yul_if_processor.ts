import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBlock, YulExpression, YulIf } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulIfProcessor extends ModernNodeProcessor<YulIf> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulIf> {
        const [id, src] = super.process(reader, config, raw);

        const condition = reader.convert(raw.condition, config) as YulExpression;
        const body = reader.convert(raw.body, config) as YulBlock;

        return [id, src, condition, body, undefined, raw];
    }
}
