import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { PragmaDirective } from "../implementation/meta/pragma_directive";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyPragmaDirectiveProcessor extends LegacyNodeProcessor<PragmaDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof PragmaDirective> {
        const [id, src, type] = super.process(reader, config, raw);

        const literals: string[] = raw.attributes.literals;

        return [id, src, type, literals, raw];
    }
}
