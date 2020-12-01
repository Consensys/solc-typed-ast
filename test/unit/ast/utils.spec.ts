import expect from "expect";
import { encodeSignature, split } from "../../../src";

describe("AST utils", () => {
    describe("split()", () => {
        const cases: Array<[string, string[] | undefined]> = [
            ["uint8,(uint16,(uint32))", ["uint8", "(uint16,(uint32))"]],
            ["uint8,(uint16,uint32))", undefined],
            ["uint8,(uint16, uint32", undefined]
        ];

        for (const [input, result] of cases) {
            if (result === undefined) {
                it(`Throws an error for "${input}"`, () => {
                    expect(() => split(input, ",", "(", ")")).toThrow();
                });
            } else {
                it(`Returns ${JSON.stringify(result)} for "${input}"`, () => {
                    expect(split(input, ",", "(", ")")).toEqual(result);
                });
            }
        }
    });

    describe("encodeSignature()", () => {
        const cases: Array<[string, boolean, string]> = [
            ["doA(uint256)", false, "092f1b5f"],
            ["doA(uint256)", true, "0x092f1b5f"],
            ["transferFrom(address,address,uint256)", false, "23b872dd"],
            ["transferFrom(address,address,uint256)", true, "0x23b872dd"]
        ];

        for (const [signature, hexPrefix, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${signature}" and ${hexPrefix}`, () => {
                expect(encodeSignature(signature, hexPrefix)).toEqual(result);
            });
        }
    });
});
