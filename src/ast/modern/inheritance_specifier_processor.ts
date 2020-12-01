import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { InheritanceSpecifier } from "../implementation/meta/inheritance_specifier";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernInheritanceSpecifierProcessor extends ModernNodeProcessor<InheritanceSpecifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof InheritanceSpecifier> {
        const [id, src, type] = super.process(reader, config, raw);

        const baseType = reader.convert(raw.baseName, config) as UserDefinedTypeName;
        const args = raw.arguments
            ? (reader.convertArray(raw.arguments, config) as Expression[])
            : [];

        return [id, src, type, baseType, args, raw];
    }
}
