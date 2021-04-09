import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Statement } from "../implementation/statement/statement";
import { WhileStatement } from "../implementation/statement/while_statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernWhileStatementProcessor extends ModernNodeProcessor<WhileStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof WhileStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        const condition = reader.convert(raw.condition, config) as Expression;
        const body = reader.convert(raw.body, config) as Statement;

        return [id, src, type, condition, body, documentation, raw];
    }
}
