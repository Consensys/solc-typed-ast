import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulBlock, YulFunctionDefinition, YulTypedName } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulFunctionDefinitionProcessor extends ModernNodeProcessor<YulFunctionDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulFunctionDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const parameters = reader.convertArray(raw.parameters, config) as YulTypedName[];
        const returnParameters = reader.convertArray(
            raw.returnParameters,
            config
        ) as YulTypedName[];
        const body = reader.convert(raw.body, config) as YulBlock;

        return [id, src, -1, raw.name, parameters, returnParameters, body, undefined, raw];
    }
}
