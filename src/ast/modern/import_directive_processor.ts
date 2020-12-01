import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Identifier } from "../implementation/expression/identifier";
import { ImportDirective, SymbolAlias } from "../implementation/meta/import_directive";
import { ModernNodeProcessor } from "./node_processor";

export class ModernImportDirectiveProcessor extends ModernNodeProcessor<ImportDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ImportDirective> {
        const [id, src, type] = super.process(reader, config, raw);

        const file: string = raw.file;
        const absolutePath: string = raw.absolutePath;
        const unitAlias: string = raw.unitAlias;
        const symbolAliases: SymbolAlias[] = raw.symbolAliases;
        const scope: number = raw.scope;
        const sourceUnit: number = raw.sourceUnit;

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
