import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionCall } from "../implementation/expression/function_call";
import { RevertStatement } from "../implementation/statement/revert_statement";
import { ModernNodeProcessor } from "./node_processor";

export class ModernRevertStatementProcessor extends ModernNodeProcessor<RevertStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof RevertStatement> {
        const [id, src] = super.process(reader, config, raw);

        const documentation: string | undefined = raw.documentation;

        const errorCall = reader.convert(raw.errorCall, config) as FunctionCall;

        return [id, src, errorCall, documentation, raw];
    }
}
