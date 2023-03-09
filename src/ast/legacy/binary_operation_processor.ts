import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { BinaryOperation } from "../implementation/expression/binary_operation";
import { Expression } from "../implementation/expression/expression";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyBinaryOperationProcessor extends LegacyExpressionProcessor<BinaryOperation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof BinaryOperation> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const operator = raw.attributes.operator;

        const [leftHandSide, rightHandSide] = reader.convertArray(raw.children, config) as [
            Expression,
            Expression
        ];

        return [id, src, typeString, operator, leftHandSide, rightHandSide, undefined, raw];
    }
}
