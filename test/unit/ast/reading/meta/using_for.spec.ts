import expect from "expect";
import {
    ASTReader,
    compileJson,
    ElementaryTypeName,
    UserDefinedTypeName,
    UsingForDirective
} from "../../../../../src";

describe("UsingForDirective", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/meta/using_for_0413.json"],
        ["0.5.0", "test/samples/solidity/meta/using_for_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let uses: UsingForDirective[];

            before(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version, []);
                const [mainUnit] = reader.read(data);

                uses = mainUnit.getChildrenByType(UsingForDirective);
            });

            it("Detect correct number of nodes", () => {
                expect(uses.length).toEqual(3);
            });

            it("using SomeLibraryForAny for *", () => {
                expect(uses[0].id).toEqual(108);
                expect(uses[0].vLibraryName.id).toEqual(107);
                expect(uses[0].vLibraryName.referencedDeclaration).toEqual(91);
                expect(uses[0].vLibraryName.name).toEqual("SomeLibraryForAny");
                expect(uses[0].vTypeName === undefined).toEqual(true);
            });

            it("using SomeLibraryForUint for uint", () => {
                expect(uses[1].id).toEqual(111);
                expect(uses[1].vLibraryName.id).toEqual(109);
                expect(uses[1].vLibraryName.referencedDeclaration).toEqual(106);
                expect(uses[1].vLibraryName.name).toEqual("SomeLibraryForUint");
                expect(uses[1].vTypeName instanceof ElementaryTypeName).toEqual(true);

                const type = uses[1].vTypeName as ElementaryTypeName;

                expect(type.id).toEqual(110);
                expect(type.name).toEqual("uint");
                expect(type.typeString).toEqual("uint256");
            });

            it("using Set for Set.Data", () => {
                expect(uses[2].id).toEqual(114);
                expect(uses[2].vLibraryName.id).toEqual(112);
                expect(uses[2].vLibraryName.referencedDeclaration).toEqual(76);
                expect(uses[2].vLibraryName.name).toEqual("Set");
                expect(uses[2].vTypeName instanceof UserDefinedTypeName).toEqual(true);

                const type = uses[2].vTypeName as UserDefinedTypeName;

                expect(type.id).toEqual(113);
                expect(type.name).toEqual("Set.Data");
                expect(type.vReferencedDeclaration.id).toEqual(5);
            });
        });
    }
});
