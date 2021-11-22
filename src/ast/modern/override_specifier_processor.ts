import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernOverrideSpecifierProcessor extends ModernNodeProcessor<OverrideSpecifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof OverrideSpecifier> {
        const [id, src] = super.process(reader, config, raw);

        const overrides = reader.convertArray(raw.overrides, config) as UserDefinedTypeName[];

        return [id, src, overrides, raw];
    }
}
