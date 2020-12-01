import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ElementaryTypeNameExpression } from "../implementation/expression/elementary_type_name_expression";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernElementaryTypeNameExpressionProcessor extends ModernExpressionProcessor<ElementaryTypeNameExpression> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ElementaryTypeNameExpression> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const typeName =
            typeof raw.typeName === "string"
                ? (raw.typeName as string)
                : (reader.convert(raw.typeName, config) as ElementaryTypeName);

        return [id, src, type, typeString, typeName, raw];
    }
}
