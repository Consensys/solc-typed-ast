import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IndexAccess } from "../implementation/expression/index_access";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernIndexAccessProcessor extends ModernExpressionProcessor<IndexAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IndexAccess> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const baseExpression = reader.convert(raw.baseExpression, config) as Expression;
        const indexExpression = raw.indexExpression
            ? (reader.convert(raw.indexExpression, config) as Expression)
            : undefined;

        return [id, src, type, typeString, baseExpression, indexExpression];
    }
}
