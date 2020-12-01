import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ArrayTypeName } from "../implementation/type/array_type_name";
import { TypeName } from "../implementation/type/type_name";
import { ModernTypeNameProcessor } from "./type_name_processor";

export class ModernArrayTypeNameProcessor extends ModernTypeNameProcessor<ArrayTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ArrayTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const baseType = reader.convert(raw.baseType, config) as TypeName;
        const length = raw.length ? (reader.convert(raw.length, config) as Expression) : undefined;

        return [id, src, type, typeString, baseType, length, raw];
    }
}
