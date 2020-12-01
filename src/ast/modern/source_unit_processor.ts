import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { SourceUnit } from "../implementation/meta/source_unit";
import { ModernNodeProcessor } from "./node_processor";

export class ModernSourceUnitProcessor extends ModernNodeProcessor<SourceUnit> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof SourceUnit> {
        const [id, src, type] = super.process(reader, config, raw);

        const sourceEntryKey: string = raw.sourceEntryKey;
        const sourceListIndex = parseInt(src.slice(src.lastIndexOf(":") + 1), 10);
        const absolutePath: string = raw.absolutePath;
        const exportedSymbols = raw.exportedSymbols;

        const symbols = new Map<string, number>();

        for (const name of Object.keys(exportedSymbols)) {
            symbols.set(name, exportedSymbols[name][0]);
        }

        const children = reader.convertArray(raw.nodes, config);

        return [
            id,
            src,
            type,
            sourceEntryKey,
            sourceListIndex,
            absolutePath,
            symbols,
            children,
            raw
        ];
    }
}
