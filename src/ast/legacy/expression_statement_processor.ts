import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ExpressionStatement } from "../implementation/statement/expression_statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyExpressionStatementProcessor extends LegacyNodeProcessor<ExpressionStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ExpressionStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const [expression] = reader.convertArray(raw.children, config) as [Expression];

        return [id, src, type, expression, raw];
    }
}
