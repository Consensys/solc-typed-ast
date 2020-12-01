import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ElementaryTypeNameExpression } from "../implementation/expression/elementary_type_name_expression";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyElementaryTypeNameExpressionProcessor extends LegacyExpressionProcessor<ElementaryTypeNameExpression> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ElementaryTypeNameExpression> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const children = raw.children ? reader.convertArray(raw.children, config) : undefined;

        const [typeName] = children
            ? (children as [ElementaryTypeName])
            : ([raw.attributes.value] as [string]);

        return [id, src, type, typeString, typeName, raw];
    }
}
