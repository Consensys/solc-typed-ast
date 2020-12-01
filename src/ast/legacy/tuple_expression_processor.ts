import { ASTNode } from "../ast_node";
import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { TupleExpression } from "../implementation/expression/tuple_expression";
import { split } from "../utils";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyTupleExpressionProcessor extends LegacyExpressionProcessor<TupleExpression> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof TupleExpression> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = raw.children ? reader.convertArray(raw.children, config) : undefined;

        const isInlineArray: boolean = attributes.isInlineArray;

        const components = attributes.components
            ? this.extractComponentsFromRaw(attributes.components, reader, config)
            : this.extractComponentsFromTypeString(typeString, children);

        return [id, src, type, typeString, isInlineArray, components, raw];
    }

    private extractComponentsFromRaw(
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

    private extractComponentsFromTypeString(
        typeString: string,
        children: ASTNode[] | undefined
    ): Array<Expression | null> {
        const matches = typeString.match(/^tuple\((.*)\)$/);

        if (matches === null) {
            return children ? (children as Expression[]) : [];
        }

        /**
         * @todo split() approach may be too fragile, so pay special attention here.
         * Consider to use more robust type string parser instead.
         */
        const componentTypes: string[] = split(matches[1], ",", "(", ")");
        const nodes: Array<Expression | null> = [];

        let index = 0;

        for (const componentType of componentTypes) {
            if (componentType === "") {
                nodes.push(null);
            } else {
                const node = children ? (children[index] as Expression) : undefined;

                if (!node) {
                    throw new Error(
                        "Expected component of type " +
                            componentType +
                            " but there is no corresponding child component"
                    );
                }

                if (componentType !== node.typeString) {
                    throw new Error(
                        "Expected component of type " +
                            componentType +
                            " but got component of type " +
                            node.typeString
                    );
                }

                nodes.push(node);

                index++;
            }
        }

        return nodes;
    }
}
