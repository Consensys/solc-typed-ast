import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ModifierDefinition } from "../implementation/declaration/modifier_definition";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { Block } from "../implementation/statement/block";
import { ModernNodeProcessor } from "./node_processor";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";

export class ModernModifierDefinitionProcessor extends ModernNodeProcessor<ModifierDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ModifierDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const visibility: string = raw.visibility;
        const virtual: boolean = "virtual" in raw ? raw.virtual : false;
        const nameLocation: string | undefined = raw.nameLocation;

        let documentation: string | StructuredDocumentation | undefined;

        if (raw.documentation) {
            documentation =
                typeof raw.documentation === "string"
                    ? raw.documentation
                    : reader.convert(raw.documentation, config);
        }

        const overrideSpecifier = raw.overrides
            ? (reader.convert(raw.overrides, config) as OverrideSpecifier)
            : undefined;

        const parameters = reader.convert(raw.parameters, config) as ParameterList;

        const body = raw.body ? (reader.convert(raw.body, config) as Block) : undefined;

        return [
            id,
            src,
            name,
            virtual,
            visibility,
            parameters,
            overrideSpecifier,
            body,
            documentation,
            nameLocation,
            raw
        ];
    }
}
