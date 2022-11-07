import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulTypedName } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulTypedNameProcessor extends ModernNodeProcessor<YulTypedName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulTypedName> {
        const [id, src] = super.process(reader, config, raw);
        const name: string = raw.name;
        const typeString: string = raw.type;

        return [id, src, name, typeString, raw];
    }
}
