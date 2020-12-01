import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IndexRangeAccess } from "../implementation/expression/index_range_access";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyIndexRangeAccessProcessor extends LegacyExpressionProcessor<IndexRangeAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IndexRangeAccess> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config) as Expression[];

        const baseExpression = children.shift() as Expression;
        const startExpression = attributes.startExpression === null ? undefined : children.shift();
        const endExpression = attributes.endExpression === null ? undefined : children.shift();

        return [id, src, type, typeString, baseExpression, startExpression, endExpression, raw];
    }
}
