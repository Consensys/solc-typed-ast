import expect from "expect";
import { ASTContext, StructDefinition, UserDefinedTypeName } from "../../../../src";

describe("UserDefinedTypeName", () => {
    it("set vReferencedDeclaration", () => {
        const context = new ASTContext();

        const struct = new StructDefinition(
            1,
            "0:0:0",
            "StructDefinition",
            "MyStruct",
            "MyStruct",
            0,
            "internal",
            []
        );

        const otherStruct = new StructDefinition(
            2,
            "0:0:0",
            "StructDefinition",
            "OtherStruct",
            "OtherStruct",
            0,
            "internal",
            []
        );

        const type = new UserDefinedTypeName(
            3,
            "0:0:0",
            "UserDefinedTypeName",
            "struct MyStruct",
            "MyStruct",
            0
        );

        context.register(struct, type);

        type.vReferencedDeclaration = struct;

        expect(type.referencedDeclaration).toEqual(struct.id);
        expect(type.vReferencedDeclaration === struct).toBeTruthy();

        expect(() => {
            type.vReferencedDeclaration = otherStruct;
        }).toThrow();
    });
});
