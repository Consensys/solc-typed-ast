import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Conditional } from "../implementation/expression/conditional";
import { Expression } from "../implementation/expression/expression";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyConditionalProcessor extends LegacyExpressionProcessor<Conditional> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Conditional> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const [condition, trueExpression, falseExpression] = reader.convertArray(
            raw.children,
            config
        ) as [Expression, Expression, Expression];

        return [id, src, type, typeString, condition, trueExpression, falseExpression, raw];
    }
}
