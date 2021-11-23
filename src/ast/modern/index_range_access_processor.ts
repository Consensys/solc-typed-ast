import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IndexRangeAccess } from "../implementation/expression/index_range_access";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernIndexRangeAccessProcessor extends ModernExpressionProcessor<IndexRangeAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IndexRangeAccess> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const baseExpression = reader.convert(raw.baseExpression, config) as Expression;

        const startExpression = raw.startExpression
            ? (reader.convert(raw.startExpression, config) as Expression)
            : undefined;

        const endExpression = raw.endExpression
            ? (reader.convert(raw.endExpression, config) as Expression)
            : undefined;

        return [id, src, typeString, baseExpression, startExpression, endExpression, raw];
    }
}
