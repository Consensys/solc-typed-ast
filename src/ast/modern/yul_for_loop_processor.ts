import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBlock, YulExpression, YulForLoop } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulForLoopProcessor extends ModernNodeProcessor<YulForLoop> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulForLoop> {
        const [id, src] = super.process(reader, config, raw);

        const pre = reader.convert(raw.pre, config) as YulBlock;
        const condition = reader.convert(raw.condition, config) as YulExpression;
        const post = reader.convert(raw.post, config) as YulBlock;
        const body = reader.convert(raw.body, config) as YulBlock;

        return [id, src, pre, condition, post, body, undefined, raw];
    }
}
