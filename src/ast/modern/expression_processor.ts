import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression, ExpressionConstructor } from "../implementation/expression/expression";
import { ModernNodeProcessor } from "./node_processor";

export class ModernExpressionProcessor<T extends Expression> extends ModernNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ExpressionConstructor<T>> {
        const [id, src] = super.process(reader, config, raw);

        const typeString: string = raw.typeDescriptions.typeString;

        return [id, src, typeString, undefined, raw];
    }
}
