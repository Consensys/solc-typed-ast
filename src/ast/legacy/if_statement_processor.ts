import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { IfStatement } from "../implementation/statement/if_statement";
import { Statement } from "../implementation/statement/statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyIfStatementProcessor extends LegacyNodeProcessor<IfStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof IfStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const [condition, trueBody, falseBody] = reader.convertArray(raw.children, config) as [
            Expression,
            Statement,
            Statement?
        ];

        return [id, src, type, condition, trueBody, falseBody, raw];
    }
}
