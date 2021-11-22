import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression, ExpressionConstructor } from "../implementation/expression/expression";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyExpressionProcessor<T extends Expression> extends LegacyNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ExpressionConstructor<T>> {
        const [id, src] = super.process(reader, config, raw);
        const typeString: string = raw.attributes.type;

        return [id, src, typeString, raw];
    }
}
