import expect from "expect";
import path from "path";
import { FileSystemResolver, LocalNpmResolver, Remapping } from "../../../src";

describe("FileSystemResolver", () => {
    describe("resolve()", () => {
        const resolver = new FileSystemResolver();
        const cases: Array<[string, string | undefined]> = [
            ["test/samples/solidity/node.sol", "test/samples/solidity/node.sol"],
            ["test/samples/solidity/missing.sol", undefined]
        ];

        for (const [fileName, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${fileName}"`, () => {
                expect(resolver.resolve(fileName)).toEqual(result);
            });
        }
    });
});

describe("LocalNpmResolver", () => {
    describe("resolve()", () => {
        const inferredRemappings = new Map<string, Remapping>();
        const resolver = new LocalNpmResolver("test/", inferredRemappings);

        const cases: Array<[string, string | undefined]> = [
            [".bin/tsc", path.resolve("node_modules/.bin/tsc")],
            [".bin/missing", undefined]
        ];

        const expectedInferredRemapping = new Map<string, Remapping>([
            [".bin/tsc", ["", ".bin", path.resolve("node_modules/.bin")]]
        ]);

        for (const [fileName, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${fileName}"`, () => {
                expect(resolver.resolve(fileName)).toEqual(result);
            });
        }

        it("Inferred path remappings map is valid", () => {
            expect(inferredRemappings).toEqual(expectedInferredRemapping);
        });
    });
});
