import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionCallKind } from "../constants";
import { Expression } from "../implementation/expression/expression";
import { FunctionCall } from "../implementation/expression/function_call";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernFunctionCallProcessor extends ModernExpressionProcessor<FunctionCall> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionCall> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const kind: FunctionCallKind = raw.kind;
        const fieldNames: string[] | undefined = raw.names.length ? raw.names : undefined;

        const expression = reader.convert(raw.expression, config) as Expression;
        const args = reader.convertArray(raw.arguments, config) as Expression[];

        return [id, src, type, typeString, kind, expression, args, fieldNames, raw];
    }
}
