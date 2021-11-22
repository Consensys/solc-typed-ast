import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Return } from "../implementation/statement/return";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyReturnProcessor extends LegacyNodeProcessor<Return> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Return> {
        const [id, src] = super.process(reader, config, raw);
        const children = raw.children ? reader.convertArray(raw.children, config) : undefined;

        const functionReturnParameters: number = raw.attributes.functionReturnParameters;

        const [expression] = children ? (children as [Expression]) : [];

        return [id, src, functionReturnParameters, expression, undefined, raw];
    }
}
