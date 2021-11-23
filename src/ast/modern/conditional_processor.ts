import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Conditional } from "../implementation/expression/conditional";
import { Expression } from "../implementation/expression/expression";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernConditionalProcessor extends ModernExpressionProcessor<Conditional> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Conditional> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const condition = reader.convert(raw.condition, config) as Expression;
        const trueExpression = reader.convert(raw.trueExpression, config) as Expression;
        const falseExpression = reader.convert(raw.falseExpression, config) as Expression;

        return [id, src, typeString, condition, trueExpression, falseExpression, raw];
    }
}
