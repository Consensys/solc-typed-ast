import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EventDefinition } from "../implementation/declaration/event_definition";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { ModernNodeProcessor } from "./node_processor";

export class ModernEventDefinitionProcessor extends ModernNodeProcessor<EventDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof EventDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const anonymous: boolean = raw.anonymous;
        const name: string = raw.name;
        const nameLocation: string | undefined = raw.nameLocation;

        let documentation: string | StructuredDocumentation | undefined;

        if (raw.documentation) {
            documentation =
                typeof raw.documentation === "string"
                    ? raw.documentation
                    : reader.convert(raw.documentation, config);
        }

        const parameters = reader.convert(raw.parameters, config) as ParameterList;

        return [id, src, anonymous, name, parameters, documentation, nameLocation, raw];
    }
}
