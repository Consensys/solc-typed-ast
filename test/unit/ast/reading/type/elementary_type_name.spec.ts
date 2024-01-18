import expect from "expect";
import { ASTReader, compileJson, ElementaryTypeName } from "../../../../../src";

describe("ElementaryTypeName", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/types/types_0413.json"],
        ["0.5.0", "test/samples/solidity/types/types_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: ElementaryTypeName[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(ElementaryTypeName);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(17);
            });

            it("uint", () => {
                const elementaryType = nodes[0];

                expect(elementaryType.id).toEqual(1);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("uint");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });

            it("uint", () => {
                const elementaryType = nodes[1];

                expect(elementaryType.id).toEqual(4);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("uint");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });

            it("uint32", () => {
                const elementaryType = nodes[2];

                expect(elementaryType.id).toEqual(7);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("uint32");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });

            it("bytes16", () => {
                const elementaryType = nodes[3];

                expect(elementaryType.id).toEqual(12);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("bytes16");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });

            it("bytes32", () => {
                const elementaryType = nodes[4];

                expect(elementaryType.id).toEqual(15);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("bytes32");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });

            it("string", () => {
                const elementaryType = nodes[5];

                expect(elementaryType.id).toEqual(18);
                expect(elementaryType instanceof ElementaryTypeName).toEqual(true);
                expect(elementaryType.name).toEqual("string");
                expect(elementaryType.stateMutability).toEqual("nonpayable");
            });
        });
    }
});
