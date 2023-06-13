import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { SourceUnit } from "../implementation/meta/source_unit";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacySourceUnitProcessor extends LegacyNodeProcessor<SourceUnit> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof SourceUnit> {
        const [id, src] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const sourceEntryKey: string = raw.sourceEntryKey;
        const sourceListIndex = parseInt(src.slice(src.lastIndexOf(":") + 1), 10);
        const absolutePath: string = attributes.absolutePath;
        const exportedSymbols = attributes.exportedSymbols;

        const symbols = new Map<string, number>();

        for (const name of Object.keys(exportedSymbols)) {
            symbols.set(name, exportedSymbols[name][0]);
        }

        return [
            id,
            src,
            sourceEntryKey,
            sourceListIndex,
            absolutePath,
            symbols,
            children,
            undefined,
            raw
        ];
    }
}
