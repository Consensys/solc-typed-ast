import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulCase, YulExpression, YulSwitch } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulSwitchProcessor extends ModernNodeProcessor<YulSwitch> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulSwitch> {
        const [id, src] = super.process(reader, config, raw);

        const expression = reader.convert(raw.expression, config) as YulExpression;
        const cases = reader.convertArray(raw.cases, config) as YulCase[];

        return [id, src, expression, cases, undefined, raw];
    }
}
