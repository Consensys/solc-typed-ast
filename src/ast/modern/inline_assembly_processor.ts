import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { InlineAssembly } from "../implementation/statement/inline_assembly";
import { YulBlock } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernInlineAssemblyProcessor extends ModernNodeProcessor<InlineAssembly> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof InlineAssembly> {
        const [id, src] = super.process(reader, config, raw);

        const externalReferences: any[] = raw.externalReferences;
        const documentation: string | undefined = raw.documentation;
        const operations: string | undefined = raw.operations;
        const yul = raw.AST && (reader.convert(raw.AST, config) as YulBlock);
        const flags: string[] | undefined = raw.flags;
        const evmVersion: string | undefined = raw.evmVersion;

        return [
            id,
            src,
            externalReferences,
            operations,
            yul,
            flags,
            evmVersion,
            documentation,
            raw
        ];
    }
}
