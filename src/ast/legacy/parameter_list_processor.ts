import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { ParameterList } from "../implementation/meta/parameter_list";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyParameterListProcessor extends LegacyNodeProcessor<ParameterList> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ParameterList> {
        const [id, src] = super.process(reader, config, raw);

        const parameters = reader.convertArray(raw.children, config) as VariableDeclaration[];

        return [id, src, parameters, raw];
    }
}
