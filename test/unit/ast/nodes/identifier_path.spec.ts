import expect from "expect";
import { ASTContext, IdentifierPath, UserDefinedTypeName } from "../../../../src";

describe("IdentifierPath", () => {
    it("set vReferencedDeclaration", () => {
        const context = new ASTContext();

        const structS = new UserDefinedTypeName(1, "0:0:0", "struct S", "S", -1);
        const structT = new UserDefinedTypeName(2, "0:0:0", "struct T", "T", -1);

        const path = new IdentifierPath(3, "0:0:0", "S", structS.id);

        context.register(structS, path);

        path.vReferencedDeclaration = structS;

        expect(path.referencedDeclaration).toEqual(structS.id);
        expect(path.vReferencedDeclaration === structS).toBeTruthy();

        path.vReferencedDeclaration = undefined;

        expect(path.referencedDeclaration).toEqual(-1);
        expect(path.vReferencedDeclaration === undefined).toBeTruthy();

        expect(() => {
            path.vReferencedDeclaration = structT;
        }).toThrow();
    });
});
