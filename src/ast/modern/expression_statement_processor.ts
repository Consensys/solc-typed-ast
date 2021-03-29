import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ExpressionStatement } from "../implementation/statement/expression_statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernExpressionStatementProcessor extends ModernNodeProcessor<ExpressionStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ExpressionStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        const expression = reader.convert(raw.expression, config) as Expression;

        return [id, src, type, expression, documentation, raw];
    }
}
