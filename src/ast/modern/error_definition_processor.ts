import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ErrorDefinition } from "../implementation/declaration/error_definition";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { ModernNodeProcessor } from "./node_processor";

export class ModernErrorDefinitionProcessor extends ModernNodeProcessor<ErrorDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ErrorDefinition> {
        const [id, src, type] = super.process(reader, config, raw);

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

        return [id, src, type, name, parameters, documentation, nameLocation, raw];
    }
}
