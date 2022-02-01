import expect from "expect";
import path from "path";
import { FileSystemResolver, LocalNpmResolver } from "../../../src";

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
        const resolver = new LocalNpmResolver("test/");

        const cases: Array<[string, string | undefined]> = [
            [".bin/tsc", path.resolve("node_modules/.bin/tsc")],
            [".bin/missing", undefined]
        ];

        for (const [fileName, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${fileName}"`, () => {
                expect(resolver.resolve(fileName)).toEqual(result);
            });
        }
    });
});
