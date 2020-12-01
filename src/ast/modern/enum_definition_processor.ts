import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EnumDefinition } from "../implementation/declaration/enum_definition";
import { EnumValue } from "../implementation/declaration/enum_value";
import { ModernNodeProcessor } from "./node_processor";

export class ModernEnumDefinitionProcessor extends ModernNodeProcessor<EnumDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof EnumDefinition> {
        const [id, src, type] = super.process(reader, config, raw);

        const name: string = raw.name;
        const canonicalName: string = raw.canonicalName;

        const members = reader.convertArray(raw.members, config) as EnumValue[];

        return [id, src, type, name, canonicalName, members, raw];
    }
}
