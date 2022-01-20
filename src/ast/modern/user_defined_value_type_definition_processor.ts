import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { UserDefinedValueTypeDefinition } from "../implementation/declaration/user_defined_value_type_definition";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernUserDefinedValueTypeDefinitionProcessor extends ModernNodeProcessor<UserDefinedValueTypeDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UserDefinedValueTypeDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const nameLocation: string | undefined = raw.nameLocation;
        const underlyingType = reader.convert(raw.underlyingType, config) as ElementaryTypeName;

        return [id, src, name, underlyingType, nameLocation, raw];
    }
}
