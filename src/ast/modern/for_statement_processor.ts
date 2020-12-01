import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ExpressionStatement } from "../implementation/statement/expression_statement";
import { ForStatement } from "../implementation/statement/for_statement";
import { Statement } from "../implementation/statement/statement";
import { VariableDeclarationStatement } from "../implementation/statement/variable_declaration_statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernForStatementProcessor extends ModernNodeProcessor<ForStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ForStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const initializationExpression = raw.initializationExpression
            ? (reader.convert(raw.initializationExpression, config) as VariableDeclarationStatement)
            : undefined;

        const condition = raw.condition
            ? (reader.convert(raw.condition, config) as Expression)
            : undefined;

        const loopExpression = raw.loopExpression
            ? (reader.convert(raw.loopExpression, config) as ExpressionStatement)
            : undefined;

        const body = reader.convert(raw.body, config) as Statement;

        return [id, src, type, body, initializationExpression, condition, loopExpression, raw];
    }
}
