import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { BinaryOperation } from "../implementation/expression/binary_operation";
import { Expression } from "../implementation/expression/expression";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernBinaryOperationProcessor extends ModernExpressionProcessor<BinaryOperation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof BinaryOperation> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const operator: string = raw.operator;

        const leftExpression = reader.convert(raw.leftExpression, config) as Expression;
        const rightExpression = reader.convert(raw.rightExpression, config) as Expression;

        return [id, src, type, typeString, operator, leftExpression, rightExpression, raw];
    }
}
