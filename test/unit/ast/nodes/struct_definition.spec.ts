import expect from "expect";
import { ASTContext, SourceUnit, StructDefinition } from "../../../../src";

describe("StructDefinition", () => {
    it("set vScope", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(
            1,
            "0:0:0",
            "SourceUnit",
            "entry.sol",
            0,
            "entry.sol",
            new Map()
        );

        const otherUnit = new SourceUnit(
            2,
            "0:0:0",
            "SourceUnit",
            "other.sol",
            1,
            "other.sol",
            new Map()
        );

        const struct = new StructDefinition(
            3,
            "0:0:0",
            "StructDefinition",
            "MyStruct",
            0,
            "internal",
            []
        );

        context.register(unit, struct);

        struct.vScope = unit;

        expect(struct.scope).toEqual(unit.id);
        expect(struct.vScope === unit).toBeTruthy();

        expect(() => {
            struct.vScope = otherUnit;
        }).toThrow();
    });
});
