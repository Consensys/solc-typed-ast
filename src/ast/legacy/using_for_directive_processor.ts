import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { UsingForDirective } from "../implementation/meta/using_for_directive";
import { TypeName } from "../implementation/type/type_name";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyUsingForDirectiveProcessor extends LegacyNodeProcessor<UsingForDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UsingForDirective> {
        const [id, src, type] = super.process(reader, config, raw);

        const [libraryName, typeName] = reader.convertArray(raw.children, config) as [
            UserDefinedTypeName,
            TypeName?
        ];

        return [id, src, type, libraryName, typeName, raw];
    }
}
