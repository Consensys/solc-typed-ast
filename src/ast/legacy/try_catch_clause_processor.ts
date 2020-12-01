import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ParameterList } from "../implementation/meta/parameter_list";
import { Block } from "../implementation/statement/block";
import { TryCatchClause } from "../implementation/statement/try_catch_clause";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyTryCatchClauseProcessor extends LegacyNodeProcessor<TryCatchClause> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof TryCatchClause> {
        const [id, src, type] = super.process(reader, config, raw);
        const children = reader.convertArray(raw.children, config);

        const errorName: string = raw.attributes.errorName;

        const block = children.pop() as Block;
        const parameters = children.length ? (children.pop() as ParameterList) : undefined;

        return [id, src, type, errorName, block, parameters, raw];
    }
}
