import expect from "expect";
import { ASTContext, ImportDirective, SourceUnit } from "../../../../src";

describe("ImportDirective", () => {
    it("set vScope", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(1, "0:0:0", "entry.sol", 0, "entry.sol", new Map());
        const someUnit = new SourceUnit(2, "0:0:0", "some.sol", 1, "some.sol", new Map());
        const otherUnit = new SourceUnit(3, "0:0:0", "other.sol", 1, "other.sol", new Map());

        const directive = new ImportDirective(4, "0:0:0", "some.sol", "some.sol", "", [], 0, 0);

        context.register(unit, someUnit, directive);

        directive.vScope = unit;

        expect(directive.scope).toEqual(unit.id);
        expect(directive.vScope === unit).toBeTruthy();

        expect(() => {
            directive.vScope = otherUnit;
        }).toThrow();
    });

    it("set vSourceUnit", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(1, "0:0:0", "entry.sol", 0, "entry.sol", new Map());
        const someUnit = new SourceUnit(2, "0:0:0", "some.sol", 1, "some.sol", new Map());
        const otherUnit = new SourceUnit(3, "0:0:0", "other.sol", 1, "other.sol", new Map());

        const directive = new ImportDirective(4, "0:0:0", "some.sol", "some.sol", "", [], 0, 0);

        context.register(unit, someUnit, directive);

        directive.vSourceUnit = someUnit;

        expect(directive.sourceUnit).toEqual(someUnit.id);
        expect(directive.vSourceUnit === someUnit).toBeTruthy();

        expect(() => {
            directive.vSourceUnit = otherUnit;
        }).toThrow();
    });
});
