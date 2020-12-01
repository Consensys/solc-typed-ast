import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { FunctionCallOptions } from "../implementation/expression/function_call_options";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernFunctionCallOptionsProcessor extends ModernExpressionProcessor<FunctionCallOptions> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionCallOptions> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const names: string[] = raw.names;
        const expression = reader.convert(raw.expression, config) as Expression;
        const values = reader.convertArray(raw.options, config) as Expression[];
        const options = new Map<string, Expression>();

        for (let n = 0; n < names.length; n++) {
            options.set(names[n], values[n]);
        }

        return [id, src, type, typeString, expression, options, raw];
    }
}
