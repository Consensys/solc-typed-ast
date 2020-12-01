import { ASTNode } from "../../ast_node";
import { Identifier } from "../expression/identifier";
import { ExportedSymbol, SourceUnit } from "./source_unit";

export interface SymbolAlias {
    foreign: number | Identifier;
    local: string | null;
}

export type SymbolOrigin = ExportedSymbol;

export type ResolvedSymbolAlias = [SymbolOrigin, string | undefined];

export class ImportDirective extends ASTNode {
    /**
     * File path to the imported source file
     */
    file: string;

    /**
     * Resolved absolute file path to the imported source file
     */
    absolutePath: string;

    /**
     * An alias symbol what will be used as the reference to access exports
     * of the imported source unit
     */
    unitAlias: string;

    /**
     * An array of locally aliased symbols, that are imported from unit.
     */
    symbolAliases: SymbolAlias[];

    /**
     * Id of the scoped source unit
     */
    scope: number;

    /**
     * Id of the imported source unit
     */
    sourceUnit: number;

    constructor(
        id: number,
        src: string,
        type: string,
        file: string,
        absolutePath: string,
        unitAlias: string,
        symbolAliases: SymbolAlias[],
        scope: number,
        sourceUnit: number,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.file = file;
        this.absolutePath = absolutePath;
        this.unitAlias = unitAlias;
        this.symbolAliases = symbolAliases;
        this.scope = scope;
        this.sourceUnit = sourceUnit;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        const nodes: ASTNode[] = [];

        for (const alias of this.symbolAliases) {
            if (alias.foreign instanceof Identifier) {
                nodes.push(alias.foreign);
            }
        }

        return nodes;
    }

    /**
     * Reference to its scoped source unit
     */
    get vScope(): SourceUnit {
        return this.requiredContext.locate(this.scope) as SourceUnit;
    }

    set vScope(value: SourceUnit) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.scope = value.id;
    }

    /**
     * Reference to the imported source unit
     */
    get vSourceUnit(): SourceUnit {
        return this.requiredContext.locate(this.sourceUnit) as SourceUnit;
    }

    set vSourceUnit(value: SourceUnit) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.sourceUnit = value.id;
    }

    /**
     * Symbol aliases, resolved to their original declarations.
     */
    get vSymbolAliases(): ResolvedSymbolAlias[] {
        const result: ResolvedSymbolAlias[] = [];
        const candidates = this.vSourceUnit.vExportedSymbols;

        for (const alias of this.symbolAliases) {
            if (alias.foreign instanceof Identifier) {
                const definition = candidates.get(alias.foreign.name) as SymbolOrigin | undefined;

                if (definition) {
                    result.push([definition, alias.local === null ? undefined : alias.local]);
                }
            }
        }

        return result;
    }
}
