import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionCallKind } from "../constants";
import { Expression } from "../implementation/expression/expression";
import { FunctionCall } from "../implementation/expression/function_call";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyFunctionCallProcessor extends LegacyExpressionProcessor<FunctionCall> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionCall> {
        const [id, src, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const kind = this.detectKind(attributes);
        const fieldNames = this.detectFieldNames(attributes);

        const [expression, ...args] = reader.convertArray(raw.children, config) as Expression[];

        return [id, src, typeString, kind, expression, args, fieldNames, raw];
    }

    private detectKind(attributes: any): FunctionCallKind {
        if (attributes.type_conversion) {
            return FunctionCallKind.TypeConversion;
        }

        if (attributes.isStructConstructorCall) {
            return FunctionCallKind.StructConstructorCall;
        }

        return FunctionCallKind.FunctionCall;
    }

    private detectFieldNames(attributes: any): string[] | undefined {
        const names = attributes.names;

        return names.length && !(names.length === 1 && names[0] === null) ? names : undefined;
    }
}
