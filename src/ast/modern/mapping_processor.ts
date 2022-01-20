import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Mapping } from "../implementation/type/mapping";
import { TypeName } from "../implementation/type/type_name";
import { ModernTypeNameProcessor } from "./type_name_processor";

export class ModernMappingProcessor extends ModernTypeNameProcessor<Mapping> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Mapping> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const keyType = reader.convert(raw.keyType, config) as TypeName;
        const valueType = reader.convert(raw.valueType, config) as TypeName;

        return [id, src, typeString, keyType, valueType, raw];
    }
}
