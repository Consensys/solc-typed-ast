import expect from "expect";
import { encodeEventSignature, encodeFuncSignature, split } from "../../../src";

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

    describe("encodeFuncSignature()", () => {
        const cases: Array<[string, boolean, string]> = [
            ["doA(uint256)", false, "092f1b5f"],
            ["doA(uint256)", true, "0x092f1b5f"],
            ["transferFrom(address,address,uint256)", false, "23b872dd"],
            ["transferFrom(address,address,uint256)", true, "0x23b872dd"]
        ];

        for (const [signature, hexPrefix, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${signature}" and ${hexPrefix}`, () => {
                expect(encodeFuncSignature(signature, hexPrefix)).toEqual(result);
            });
        }
    });

    describe("encodeEventSignature()", () => {
        const cases: Array<[string, boolean, string]> = [
            [
                "EventA(uint256)",
                false,
                "13ecd826c2d05bf4a27a762c70d15391aae2c82d6a9fb8e94fa63fd3b4a90ca4"
            ],
            [
                "EventA(uint256)",
                true,
                "0x13ecd826c2d05bf4a27a762c70d15391aae2c82d6a9fb8e94fa63fd3b4a90ca4"
            ],
            [
                "SomeX(address,address,uint256)",
                false,
                "1475e221874fac5042ef18d9b8e74d6e604889fbb0d8ddcdb87e620c04ce31af"
            ],
            [
                "SomeX(address,address,uint256)",
                true,
                "0x1475e221874fac5042ef18d9b8e74d6e604889fbb0d8ddcdb87e620c04ce31af"
            ]
        ];

        for (const [signature, hexPrefix, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for "${signature}" and ${hexPrefix}`, () => {
                expect(encodeEventSignature(signature, hexPrefix)).toEqual(result);
            });
        }
    });
});
