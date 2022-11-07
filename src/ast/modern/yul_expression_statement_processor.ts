import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulExpression, YulExpressionStatement } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulExpressionStatementProcessor extends ModernNodeProcessor<YulExpressionStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulExpressionStatement> {
        const [id, src] = super.process(reader, config, raw);

        const expression = reader.convert(raw.expression, config) as YulExpression;

        return [id, src, expression, undefined, raw];
    }
}
