import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulLeave } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulLeaveProcessor extends ModernNodeProcessor<YulLeave> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulLeave> {
        const [id, src] = super.process(reader, config, raw);

        return [id, src, undefined, raw];
    }
}
