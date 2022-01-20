import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { UsingForDirective } from "../implementation/meta/using_for_directive";
import { TypeName } from "../implementation/type/type_name";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernUsingForDirectiveProcessor extends ModernNodeProcessor<UsingForDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UsingForDirective> {
        const [id, src] = super.process(reader, config, raw);

        const libraryName = reader.convert(raw.libraryName, config) as UserDefinedTypeName;
        const typeName = raw.typeName
            ? (reader.convert(raw.typeName, config) as TypeName)
            : undefined;

        return [id, src, libraryName, typeName, raw];
    }
}
