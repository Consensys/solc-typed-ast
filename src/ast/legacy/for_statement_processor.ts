import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { ExpressionStatement } from "../implementation/statement/expression_statement";
import { ForStatement } from "../implementation/statement/for_statement";
import { Statement } from "../implementation/statement/statement";
import { VariableDeclarationStatement } from "../implementation/statement/variable_declaration_statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyForStatementProcessor extends LegacyNodeProcessor<ForStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ForStatement> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes || {};
        const children = reader.convertArray(raw.children, config);

        const initializationExpression =
            attributes.initializationExpression === null
                ? undefined
                : (children.shift() as VariableDeclarationStatement);

        const condition =
            attributes.condition === null ? undefined : (children.shift() as Expression);

        const loopExpression =
            attributes.loopExpression === null
                ? undefined
                : (children.shift() as ExpressionStatement);

        const body = children.shift() as Statement;

        return [
            id,
            src,
            type,
            body,
            initializationExpression,
            condition,
            loopExpression,
            undefined,
            raw
        ];
    }
}
