import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EnumValue } from "../implementation/declaration/enum_value";
import { ModernNodeProcessor } from "./node_processor";

export class ModernEnumValueProcessor extends ModernNodeProcessor<EnumValue> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof EnumValue> {
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const nameLocation: string | undefined = raw.nameLocation;

        return [id, src, name, nameLocation, raw];
    }
}
