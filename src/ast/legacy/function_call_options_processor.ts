import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { FunctionCallOptions } from "../implementation/expression/function_call_options";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyFunctionCallOptionsProcessor extends LegacyExpressionProcessor<FunctionCallOptions> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionCallOptions> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const names: string[] = raw.attributes.names;
        const [expression, ...values] = reader.convertArray(raw.children, config) as Expression[];
        const options = new Map<string, Expression>();

        for (let n = 0; n < names.length; n++) {
            options.set(names[n], values[n]);
        }

        return [id, src, type, typeString, expression, options, raw];
    }
}
