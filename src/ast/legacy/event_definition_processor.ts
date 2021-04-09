import { ASTNode } from "../ast_node";
import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EventDefinition } from "../implementation/declaration/event_definition";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyEventDefinitionProcessor extends LegacyNodeProcessor<EventDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof EventDefinition> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const anonymous: boolean = attributes.anonymous;
        const name: string = attributes.name;

        const [structuredDocumentation, parameters] = this.extract(children);

        let documentation: string | StructuredDocumentation | undefined;

        if (structuredDocumentation) {
            documentation = structuredDocumentation;
        } else if (typeof attributes.documentation === "string") {
            documentation = attributes.documentation;
        }

        return [id, src, type, anonymous, name, parameters, documentation, undefined, raw];
    }

    private extract(children: ASTNode[]): [StructuredDocumentation | undefined, ParameterList] {
        let node = children.shift();

        let documentation: StructuredDocumentation | undefined;

        if (node instanceof StructuredDocumentation) {
            documentation = node;

            node = children.shift();
        }

        const parameters = node as ParameterList;

        return [documentation, parameters];
    }
}
