import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Block } from "../implementation/statement/block";
import { Statement } from "../implementation/statement/statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyBlockProcessor extends LegacyNodeProcessor<Block> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Block> {
        const [id, src, type] = super.process(reader, config, raw);

        const statements = reader.convertArray(raw.children, config) as Statement[];

        return [id, src, type, statements, raw];
    }
}
