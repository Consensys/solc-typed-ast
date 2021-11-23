import expect from "expect";
import {
    ASTContext,
    DataLocation,
    ElementaryTypeName,
    Mutability,
    SourceUnit,
    StateVariableVisibility,
    VariableDeclaration
} from "../../../../src";

describe("VariableDeclaration", () => {
    it("set vScope", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(1, "0:0:0", "entry.sol", 0, "entry.sol", new Map());
        const otherUnit = new SourceUnit(2, "0:0:0", "other.sol", 1, "other.sol", new Map());

        const type = new ElementaryTypeName(3, "0:0:0", "uint256", "uint256");
        const variable = new VariableDeclaration(
            4,
            "0:0:0",
            true,
            false,
            "myVar",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Constant,
            type.typeString,
            undefined,
            type
        );

        context.register(unit, type, variable);

        variable.vScope = unit;

        expect(variable.scope).toEqual(unit.id);
        expect(variable.vScope === unit).toBeTruthy();

        expect(() => {
            variable.vScope = otherUnit;
        }).toThrow();
    });
});
