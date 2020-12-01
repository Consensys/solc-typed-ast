import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyStructuredDocumentationProcessor extends LegacyNodeProcessor<StructuredDocumentation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof StructuredDocumentation> {
        const [id, src, type] = super.process(reader, config, raw);

        const text: string = raw.attributes.text;

        return [id, src, type, text, raw];
    }
}
