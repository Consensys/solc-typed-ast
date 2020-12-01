import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { TupleExpression } from "../implementation/expression/tuple_expression";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernTupleExpressionProcessor extends ModernExpressionProcessor<TupleExpression> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof TupleExpression> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const isInlineArray: boolean = raw.isInlineArray;
        const components = this.extractComponents(raw.components, reader, config);

        return [id, src, type, typeString, isInlineArray, components, raw];
    }

    private extractComponents(
        components: any[],
        reader: ASTReader,
        config: ASTReaderConfiguration
    ): Array<Expression | null> {
        const nodes: Array<Expression | null> = [];

        for (const component of components) {
            const node =
                component === null ? null : (reader.convert(component, config) as Expression);

            nodes.push(node);
        }

        return nodes;
    }
}
