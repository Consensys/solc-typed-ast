import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulIdentifier } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulIdentifierProcessor extends ModernNodeProcessor<YulIdentifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulIdentifier> {
        const [id, src] = super.process(reader, config, raw);
        const name: string = raw.name;

        return [id, src, name, -1, raw];
    }
}
