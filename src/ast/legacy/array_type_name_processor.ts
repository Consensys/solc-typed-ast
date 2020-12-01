import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ArrayTypeName } from "../implementation/type/array_type_name";
import { TypeName } from "../implementation/type/type_name";
import { LegacyTypeNameProcessor } from "./type_name_processor";

export class LegacyArrayTypeNameProcessor extends LegacyTypeNameProcessor<ArrayTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ArrayTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const [baseType, length] = reader.convertArray(raw.children, config) as [
            TypeName,
            Expression?
        ];

        return [id, src, type, typeString, baseType, length, raw];
    }
}
