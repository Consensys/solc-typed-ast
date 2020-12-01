import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ParameterList } from "../implementation/meta/parameter_list";
import { Block } from "../implementation/statement/block";
import { TryCatchClause } from "../implementation/statement/try_catch_clause";
import { ModernNodeProcessor } from "./node_processor";

export class ModernTryCatchClauseProcessor extends ModernNodeProcessor<TryCatchClause> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof TryCatchClause> {
        const [id, src, type] = super.process(reader, config, raw);

        const errorName: string = raw.errorName;

        const parameters = raw.parameters
            ? (reader.convert(raw.parameters, config) as ParameterList)
            : undefined;

        const block = reader.convert(raw.block, config) as Block;

        return [id, src, type, errorName, block, parameters, raw];
    }
}
