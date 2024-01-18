import expect from "expect";
import {
    ASTReader,
    compileJson,
    ElementaryTypeName,
    Mapping,
    UserDefinedTypeName
} from "../../../../../src";

describe("Mapping", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/types/types_0413.json"],
        ["0.5.0", "test/samples/solidity/types/types_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: Mapping[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(Mapping);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(3);
            });

            it("mapping (address => uint)", () => {
                const mapping = nodes[0];

                expect(mapping.id).toEqual(23);
                expect(mapping instanceof Mapping).toEqual(true);

                expect(mapping.vKeyType instanceof ElementaryTypeName).toEqual(true);
                expect(mapping.vValueType instanceof ElementaryTypeName).toEqual(true);

                const key = mapping.vKeyType as ElementaryTypeName;
                const value = mapping.vValueType as ElementaryTypeName;

                expect(key.typeString).toEqual("address");
                expect(value.typeString).toEqual("uint256");
            });

            it("mapping (address => DeviceData)", () => {
                const mapping = nodes[1];

                expect(mapping.id).toEqual(27);
                expect(mapping instanceof Mapping).toEqual(true);

                expect(mapping.vKeyType instanceof ElementaryTypeName).toEqual(true);
                expect(mapping.vValueType instanceof UserDefinedTypeName).toEqual(true);

                const key = mapping.vKeyType as ElementaryTypeName;
                const value = mapping.vValueType as UserDefinedTypeName;

                expect(key.typeString).toEqual("address");
                expect(value.name).toEqual("DeviceData");
            });

            it("mapping (address => uint)", () => {
                const mapping = nodes[2];

                expect(mapping.id).toEqual(44);
                expect(mapping instanceof Mapping).toEqual(true);

                expect(mapping.vKeyType instanceof ElementaryTypeName).toEqual(true);
                expect(mapping.vValueType instanceof ElementaryTypeName).toEqual(true);

                const key = mapping.vKeyType as ElementaryTypeName;
                const value = mapping.vValueType as ElementaryTypeName;

                expect(key.typeString).toEqual("address");
                expect(value.typeString).toEqual("uint256");
            });
        });
    }
});
