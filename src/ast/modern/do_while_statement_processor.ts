import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { DoWhileStatement } from "../implementation/statement/do_while_statement";
import { Statement } from "../implementation/statement/statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernDoWhileStatementProcessor extends ModernNodeProcessor<DoWhileStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof DoWhileStatement> {
        const [id, src] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        const condition = reader.convert(raw.condition, config) as Expression;
        const body = reader.convert(raw.body, config) as Statement;

        return [id, src, condition, body, documentation, raw];
    }
}
