import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Assignment } from "../implementation/expression/assignment";
import { Expression } from "../implementation/expression/expression";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernAssignmentProcessor extends ModernExpressionProcessor<Assignment> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Assignment> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const operator: string = raw.operator;

        const leftHandSide = reader.convert(raw.leftHandSide, config) as Expression;
        const rightHandSide = reader.convert(raw.rightHandSide, config) as Expression;

        return [id, src, type, typeString, operator, leftHandSide, rightHandSide, raw];
    }
}
