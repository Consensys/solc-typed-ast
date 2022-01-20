import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { ParameterList } from "../implementation/meta/parameter_list";
import { ModernNodeProcessor } from "./node_processor";

export class ModernParameterListProcessor extends ModernNodeProcessor<ParameterList> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ParameterList> {
        const [id, src] = super.process(reader, config, raw);

        const parameters = reader.convertArray(raw.parameters, config) as VariableDeclaration[];

        return [id, src, parameters, raw];
    }
}
