import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EnumValue } from "../implementation/declaration/enum_value";
import { EnumDefinition } from "../implementation/declaration/enum_definition";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyEnumDefinitionProcessor extends LegacyNodeProcessor<EnumDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof EnumDefinition> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const members = reader.convertArray(raw.children, config) as EnumValue[];

        const name: string = attributes.name;

        return [id, src, type, name, members, undefined, raw];
    }
}
