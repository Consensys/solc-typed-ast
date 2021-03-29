import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { InlineAssembly, YulNode } from "../implementation/statement/inline_assembly";
import { ModernNodeProcessor } from "./node_processor";

export class ModernInlineAssemblyProcessor extends ModernNodeProcessor<InlineAssembly> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof InlineAssembly> {
        const [id, src, type] = super.process(reader, config, raw);

        const externalReferences: any[] = raw.externalReferences;
        const documentation: string | undefined = raw.documentation;
        const operations: string | undefined = raw.operations;
        const yul: YulNode | undefined = raw.AST;

        return [id, src, type, externalReferences, operations, yul, documentation, raw];
    }
}
