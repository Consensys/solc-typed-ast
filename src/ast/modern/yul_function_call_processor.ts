import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulExpression, YulFunctionCall, YulIdentifier } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulFunctionCallProcessor extends ModernNodeProcessor<YulFunctionCall> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulFunctionCall> {
        const [id, src] = super.process(reader, config, raw);

        const functionName = reader.convert(raw.functionName, config) as YulIdentifier;
        const args = reader.convertArray(raw.arguments, config) as YulExpression[];

        return [id, src, functionName, args, raw];
    }
}
