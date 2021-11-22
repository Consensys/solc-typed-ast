import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Assignment } from "../implementation/expression/assignment";
import { Expression } from "../implementation/expression/expression";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyAssignmentProcessor extends LegacyExpressionProcessor<Assignment> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Assignment> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const operator: string = raw.attributes.operator;

        const [leftHandSide, rightHandSide] = reader.convertArray(raw.children, config) as [
            Expression,
            Expression
        ];

        return [id, src, typeString, operator, leftHandSide, rightHandSide, raw];
    }
}
