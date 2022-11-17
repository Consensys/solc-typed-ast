import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBlock, YulCase, YulLiteral } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulCaseProcessor extends ModernNodeProcessor<YulCase> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulCase> {
        const [id, src] = super.process(reader, config, raw);

        const value =
            raw.value === "default" ? raw.value : (reader.convert(raw.value, config) as YulLiteral);

        const body = reader.convert(raw.body, config) as YulBlock;

        return [id, src, value, body, undefined, raw];
    }
}
