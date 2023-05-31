import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { UnaryOperation } from "../implementation/expression/unary_operation";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyUnaryOperationProcessor extends LegacyExpressionProcessor<UnaryOperation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UnaryOperation> {
        const [id, src, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const prefix: boolean = attributes.prefix;
        const operator: string = attributes.operator;

        const [subExpression] = reader.convertArray(raw.children, config) as [Expression];

        return [id, src, typeString, prefix, operator, subExpression, undefined, raw];
    }
}
