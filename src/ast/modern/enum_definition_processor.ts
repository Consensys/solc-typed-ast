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
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const nameLocation: string | undefined = raw.nameLocation;

        const members = reader.convertArray(raw.members, config) as EnumValue[];

        return [id, src, name, members, nameLocation, raw];
    }
}
