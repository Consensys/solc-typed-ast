import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { UnaryOperation } from "../implementation/expression/unary_operation";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernUnaryOperationProcessor extends ModernExpressionProcessor<UnaryOperation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UnaryOperation> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const prefix: boolean = raw.prefix;
        const operator: string = raw.operator;

        const subExpression = reader.convert(raw.subExpression, config) as Expression;

        return [id, src, type, typeString, prefix, operator, subExpression, raw];
    }
}
