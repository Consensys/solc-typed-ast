import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { StructDefinition } from "../implementation/declaration/struct_definition";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { ModernNodeProcessor } from "./node_processor";

export class ModernStructDefinitionProcessor extends ModernNodeProcessor<StructDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof StructDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const scope: number = raw.scope;
        const visibility: string = raw.visibility;
        const nameLocation: string | undefined = raw.nameLocation;

        let documentation: string | StructuredDocumentation | undefined;

        if (raw.documentation) {
            documentation =
                typeof raw.documentation === "string"
                    ? raw.documentation
                    : reader.convert(raw.documentation, config);
        }

        const members = reader.convertArray(raw.members, config) as VariableDeclaration[];

        return [id, src, name, scope, visibility, members, documentation, nameLocation, raw];
    }
}
