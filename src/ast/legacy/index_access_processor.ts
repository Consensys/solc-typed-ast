import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IndexAccess } from "../implementation/expression/index_access";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyIndexAccessProcessor extends LegacyExpressionProcessor<IndexAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IndexAccess> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const [baseExpression, indexExpression] = reader.convertArray(raw.children, config) as [
            Expression,
            Expression | undefined
        ];

        return [id, src, type, typeString, baseExpression, indexExpression, raw];
    }
}
