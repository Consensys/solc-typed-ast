import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Statement } from "../implementation/statement/statement";
import { WhileStatement } from "../implementation/statement/while_statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyWhileStatementProcessor extends LegacyNodeProcessor<WhileStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof WhileStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const [condition, body] = reader.convertArray(raw.children, config) as [
            Expression,
            Statement
        ];

        return [id, src, type, condition, body, raw];
    }
}
