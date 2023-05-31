import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { VariableDeclaration } from "../implementation/declaration";
import { StructDefinition } from "../implementation/declaration/struct_definition";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyStructDefinitionProcessor extends LegacyNodeProcessor<StructDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof StructDefinition> {
        const [id, src] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const members = reader.convertArray(raw.children, config) as VariableDeclaration[];

        const name: string = attributes.name;
        const scope: number = attributes.scope;
        const visibility: string = attributes.visibility;

        return [id, src, name, scope, visibility, members, undefined, undefined, raw];
    }
}
