import expect from "expect";
import { ASTNodeFactory, ImportRefType } from "../../../src";

const factory = new ASTNodeFactory();

const testUnit = factory.makeSourceUnit("test.sol", 0, "path/to/test.sol", new Map());
const targetUnit = factory.makeSourceUnit("other.sol", 1, "path/to/other.sol", new Map());
const aliasedUnitImport = factory.makeImportDirective(
    testUnit.sourceEntryKey,
    testUnit.absolutePath,
    "some",
    [],
    targetUnit.id,
    testUnit.id
);

const nonAliasedUnitImport = factory.makeImportDirective(
    testUnit.sourceEntryKey,
    testUnit.absolutePath,
    "",
    [],
    targetUnit.id,
    testUnit.id
);

const aliasedSymbolsImport = factory.makeImportDirective(
    testUnit.sourceEntryKey,
    testUnit.absolutePath,
    "",
    [{ foreign: 0, local: "x" }],
    targetUnit.id,
    testUnit.id
);

targetUnit.appendChild(aliasedUnitImport);
targetUnit.appendChild(nonAliasedUnitImport);
targetUnit.appendChild(aliasedSymbolsImport);

describe("ImportRefType", () => {
    it("Constructor passes for aliased unit import", () => {
        const type = new ImportRefType(aliasedUnitImport);

        expect(type).toBeInstanceOf(ImportRefType);
        expect(type.importStmt).toEqual(aliasedUnitImport);
        expect(type.getFields()).toEqual([aliasedUnitImport]);
        expect(type.pp()).toEqual(
            `<import ${aliasedUnitImport.file} as ${aliasedUnitImport.unitAlias}>`
        );
    });

    it("Constructor throws for non-aliased unit import", () => {
        expect(() => new ImportRefType(nonAliasedUnitImport)).toThrow();
    });

    it("Constructor throws for aliased sympols import", () => {
        expect(() => new ImportRefType(aliasedSymbolsImport)).toThrow();
    });
});
