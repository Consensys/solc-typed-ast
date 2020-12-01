import expect from "expect";
import {
    ArrayTypeName,
    ASTContext,
    ASTNode,
    DataLocation,
    ElementaryTypeName,
    Identifier,
    MemberAccess,
    Mutability,
    StateVariableVisibility,
    VariableDeclaration
} from "../../../../src";

describe("MemberAccess", () => {
    it("set vReferencedDeclaration", () => {
        const context = new ASTContext();

        const arrayBaseType = new ElementaryTypeName(
            1,
            "0:0:0",
            "ElementaryTypeName",
            "uint256",
            "uint256"
        );

        const arrayType = new ArrayTypeName(
            2,
            "0:0:0",
            "ArrayTypeName",
            "uint256[] memory",
            arrayBaseType
        );

        const variable = new VariableDeclaration(
            3,
            "0:0:0",
            "VariableDeclaration",
            true,
            false,
            "myArr",
            0,
            false,
            DataLocation.Default,
            StateVariableVisibility.Default,
            Mutability.Constant,
            arrayType.typeString,
            undefined,
            arrayType
        );

        const identifier = new Identifier(
            4,
            "0:0:0",
            "Identifier",
            arrayBaseType.typeString,
            "myArr",
            0
        );

        const memberAccess = new MemberAccess(
            5,
            "0:0:0",
            "MemberAccess",
            "uint256",
            identifier,
            "length",
            -1
        );

        const other = new ASTNode(6, "0:0:0", "Custom");

        context.register(arrayBaseType, arrayType, variable, identifier, memberAccess);

        memberAccess.vReferencedDeclaration = variable;

        expect(memberAccess.referencedDeclaration).toEqual(variable.id);
        expect(memberAccess.vReferencedDeclaration === variable).toBeTruthy();

        memberAccess.vReferencedDeclaration = undefined;

        expect(memberAccess.referencedDeclaration).toEqual(-1);
        expect(memberAccess.vReferencedDeclaration === undefined).toBeTruthy();

        expect(() => {
            memberAccess.vReferencedDeclaration = other;
        }).toThrow();
    });
});
