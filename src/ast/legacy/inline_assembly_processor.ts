import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { InlineAssembly } from "../implementation/statement/inline_assembly";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyInlineAssemblyProcessor extends LegacyNodeProcessor<InlineAssembly> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof InlineAssembly> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const externalReferences: any[] = attributes.externalReferences;
        const operations: string | undefined = attributes.operations;

        /**
         * Yul AST is absent in Solidity legacy AST.
         * It is presented as code string in `operations` attribute instead.
         */
        const yul = undefined;

        return [id, src, type, externalReferences, operations, yul, undefined, raw];
    }
}
