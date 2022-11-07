import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBreak } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulBreakProcessor extends ModernNodeProcessor<YulBreak> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulBreak> {
        const [id, src] = super.process(reader, config, raw);

        return [id, src, undefined, raw];
    }
}
