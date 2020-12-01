import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression, ExpressionConstructor } from "../implementation/expression/expression";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyExpressionProcessor<T extends Expression> extends LegacyNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ExpressionConstructor<T>> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const typeString: string = attributes.type;

        return [id, src, type, typeString, raw];
    }
}
