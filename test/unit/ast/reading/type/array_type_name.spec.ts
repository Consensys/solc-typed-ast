import expect from "expect";
import {
    ArrayTypeName,
    ASTReader,
    compileJson,
    ElementaryTypeName,
    UserDefinedTypeName
} from "../../../../../src";

describe("ArrayTypeName", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/types/types_0413.json"],
        ["0.5.0", "test/samples/solidity/types/types_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: ArrayTypeName[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(ArrayTypeName);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(2);
            });

            it("uint[]", () => {
                const arrayType = nodes[0];

                expect(arrayType.id).toEqual(37);
                expect(arrayType instanceof ArrayTypeName).toEqual(true);

                expect(arrayType.vBaseType instanceof ElementaryTypeName).toEqual(true);
                expect(arrayType.vLength).toBeUndefined();

                const baseType = arrayType.vBaseType as ElementaryTypeName;

                expect(baseType.typeString).toEqual("uint256");
            });

            it("DeviceData[]", () => {
                const arrayType = nodes[1];

                expect(arrayType.id).toEqual(40);
                expect(arrayType instanceof ArrayTypeName).toEqual(true);

                expect(arrayType.vBaseType instanceof UserDefinedTypeName).toEqual(true);
                expect(arrayType.vLength).toBeUndefined();

                const baseType = arrayType.vBaseType as UserDefinedTypeName;

                expect(baseType.name).toEqual("DeviceData");
            });
        });
    }
});
