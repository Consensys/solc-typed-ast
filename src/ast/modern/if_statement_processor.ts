import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IfStatement } from "../implementation/statement/if_statement";
import { Statement } from "../implementation/statement/statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernIfStatementProcessor extends ModernNodeProcessor<IfStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IfStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const condition = reader.convert(raw.condition, config) as Expression;
        const trueBody = reader.convert(raw.trueBody, config) as Statement;
        const falseBody = raw.falseBody
            ? (reader.convert(raw.falseBody, config) as Statement)
            : undefined;

        return [id, src, type, condition, trueBody, falseBody, raw];
    }
}
