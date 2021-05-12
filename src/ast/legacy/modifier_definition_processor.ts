import { ASTNode } from "../ast_node";
import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ModifierDefinition } from "../implementation/declaration/modifier_definition";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { Block } from "../implementation/statement/block";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyModifierDefinitionProcessor extends LegacyNodeProcessor<ModifierDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ModifierDefinition> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const name: string = attributes.name;
        const visibility: string = attributes.visibility;
        const virtual: boolean = "virtual" in attributes ? attributes.virtual : false;

        const [structuredDocumentation, overrideSpecifier, parameters, body] =
            this.extract(children);

        let documentation: string | StructuredDocumentation | undefined;

        if (structuredDocumentation) {
            documentation = structuredDocumentation;
        } else if (typeof attributes.documentation === "string") {
            documentation = attributes.documentation;
        }

        return [
            id,
            src,
            type,
            name,
            virtual,
            visibility,
            parameters,
            overrideSpecifier,
            body,
            documentation,
            undefined,
            raw
        ];
    }

    private extract(
        children: ASTNode[]
    ): [
        StructuredDocumentation | undefined,
        OverrideSpecifier | undefined,
        ParameterList,
        Block | undefined
    ] {
        let node = children.shift();

        let documentation: StructuredDocumentation | undefined;

        if (node instanceof StructuredDocumentation) {
            documentation = node;

            node = children.shift();
        }

        const parameters = node as ParameterList;

        node = children.shift();

        let overrideSpecifier: OverrideSpecifier | undefined;

        if (node instanceof OverrideSpecifier) {
            overrideSpecifier = node;

            node = children.shift();
        }

        const body = node as Block | undefined;

        return [documentation, overrideSpecifier, parameters, body];
    }
}
