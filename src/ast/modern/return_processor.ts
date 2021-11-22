import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Return } from "../implementation/statement/return";
import { ModernNodeProcessor } from "./node_processor";

export class ModernReturnProcessor extends ModernNodeProcessor<Return> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Return> {
        const [id, src] = super.process(reader, config, raw);

        const functionReturnParameters: number = raw.functionReturnParameters;
        const documentation: string | undefined = raw.documentation;

        const expression = raw.expression
            ? (reader.convert(raw.expression, config) as Expression)
            : undefined;

        return [id, src, functionReturnParameters, expression, documentation, raw];
    }
}
