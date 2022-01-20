import expect from "expect";
import {
    ASTContext,
    DataLocation,
    ElementaryTypeName,
    Identifier,
    Mutability,
    StateVariableVisibility,
    VariableDeclaration
} from "../../../../src";

describe("Identifier", () => {
    it("set vReferencedDeclaration", () => {
        const context = new ASTContext();

        const myType = new ElementaryTypeName(1, "0:0:0", "uint256", "uint256");

        const myVar = new VariableDeclaration(
            2,
            "0:0:0",
            true,
            false,
            "myVar",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Constant,
            myType.typeString,
            undefined,
            myType
        );

        const otherType = new ElementaryTypeName(3, "0:0:0", "uint256", "uint256");

        const otherVar = new VariableDeclaration(
            4,
            "0:0:0",
            true,
            false,
            "otherVar",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Constant,
            otherType.typeString,
            undefined,
            otherType
        );

        const identifier = new Identifier(5, "0:0:0", myType.typeString, "myVar", 0);

        context.register(myVar, myType, identifier);

        identifier.vReferencedDeclaration = myVar;

        expect(identifier.referencedDeclaration).toEqual(myVar.id);
        expect(identifier.vReferencedDeclaration === myVar).toBeTruthy();

        identifier.vReferencedDeclaration = undefined;

        expect(identifier.referencedDeclaration).toEqual(-1);
        expect(identifier.vReferencedDeclaration === undefined).toBeTruthy();

        expect(() => {
            identifier.vReferencedDeclaration = otherVar;
        }).toThrow();
    });
});
