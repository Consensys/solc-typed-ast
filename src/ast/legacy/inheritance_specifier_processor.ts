import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { InheritanceSpecifier } from "../implementation/meta/inheritance_specifier";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyInheritanceSpecifierProcessor extends LegacyNodeProcessor<InheritanceSpecifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof InheritanceSpecifier> {
        const [id, src, type] = super.process(reader, config, raw);

        const [baseType, ...args] = reader.convertArray(raw.children, config) as [
            UserDefinedTypeName,
            ...Expression[]
        ];

        return [id, src, type, baseType, args, raw];
    }
}
