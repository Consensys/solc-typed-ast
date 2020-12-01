import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Identifier } from "../implementation/expression/identifier";
import { ImportDirective, SymbolAlias } from "../implementation/meta/import_directive";
import { LegacyNodeProcessor } from "./node_processor";

const aliasesFilterFn = (alias: SymbolAlias | null) => alias != null;

export class LegacyImportDirectiveProcessor extends LegacyNodeProcessor<ImportDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ImportDirective> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const file: string = attributes.file;
        const absolutePath: string = attributes.absolutePath;
        const unitAlias: string = attributes.unitAlias;
        const symbolAliases: SymbolAlias[] = attributes.symbolAliases.filter(aliasesFilterFn);
        const scope: number = attributes.scope;
        const sourceUnit: number = attributes.SourceUnit;

        for (const alias of symbolAliases) {
            if (typeof alias.foreign !== "number") {
                alias.foreign = reader.convert(alias.foreign, config) as Identifier;
            }
        }

        return [
            id,
            src,
            type,
            file,
            absolutePath,
            unitAlias,
            symbolAliases,
            scope,
            sourceUnit,
            raw
        ];
    }
}
