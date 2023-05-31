import expect from "expect";
import {
    extractSpecifiersFromSource,
    getCompilerVersionsBySpecifiers,
    isExact,
    isFixed,
    isFloating,
    normalizeSpecifier
} from "../../../src";

describe("Compile version utils", () => {
    describe("isFixed()", () => {
        const cases: Array<[string, boolean]> = [
            ["0.5.0", true],
            ["^0.5.0", false],
            ["=0.5.0", true],
            [">=0.5.0", false],
            ["<=0.5.0", false],
            ["0.4.0 - 0.5.0", false],
            ["0.*.0", false],
            ["0.5", false],
            ["5", false]
        ];

        for (const [version, result] of cases) {
            it(`Returns ${result} for ${JSON.stringify(version)}`, () => {
                expect(isFixed(version)).toEqual(result);
            });
        }
    });

    describe("isFloating()", () => {
        const cases: Array<[string, boolean]> = [
            ["0.5.0", false],
            ["^0.5.0", true],
            ["=0.5.0", false],
            [">=0.5.0", true],
            ["<=0.5.0", true],
            ["0.4.0 - 0.5.0", true],
            ["0.*.0", true],
            ["0.5", true],
            ["5", true]
        ];

        for (const [version, result] of cases) {
            it(`Returns ${result} for ${JSON.stringify(version)}`, () => {
                expect(isFloating(version)).toEqual(result);
            });
        }
    });

    describe("isExact()", () => {
        const cases: Array<[string, boolean]> = [
            ["0.5.0", true],
            ["^0.5.0", false],
            ["=0.5.0", false],
            [">=0.5.0", false],
            ["<=0.5.0", false],
            ["0.4.0 - 0.5.0", false],
            ["0.*.0", false],
            ["0.5", false],
            ["5", false]
        ];

        for (const [version, result] of cases) {
            it(`Returns ${result} for ${version}`, () => {
                expect(isExact(version)).toEqual(result);
            });
        }
    });

    describe("getCompilerVersionsBySpecifiers()", () => {
        const cases: Array<[string[], string[], string[]]> = [
            [[">0.5.0 <0.5.4", "=0.5.2"], ["0.5.0", "0.5.1", "0.5.2", "0.5.3", "0.5.4"], ["0.5.2"]],
            [
                [
                    ">=0.4.0 <0.6.0",
                    ">=0.4.0 <0.6.0",
                    ">=0.4.14 <0.6.0",
                    ">0.4.13 <0.6.0",
                    "0.4.24 - 0.5.2",
                    ">=0.4.24 <=0.5.3 ~0.4.20",
                    "<0.4.26",
                    "~0.4.20",
                    "^0.4.14",
                    "0.4.*",
                    "0.*",
                    "*",
                    "0.4",
                    "0"
                ],
                ["0.4.23", "0.4.24", "0.4.25", "0.4.26", "0.5.0"],
                ["0.4.24", "0.4.25"]
            ]
        ];

        for (const [specifiers, versions, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for the input`, () => {
                expect(getCompilerVersionsBySpecifiers(specifiers, versions)).toEqual(result);
            });
        }
    });

    describe("normalizeSpecifier()", () => {
        const cases: Array<[string, string]> = [
            ["~ 0.5.0  ", "~0.5.0"],
            ["^ 0.5.0", "^0.5.0"],
            ["= 0.5.0", "=0.5.0"],
            [">= 0.5.0 <  0.6.0", ">=0.5.0 <0.6.0"],
            ["< = 0.5.0", "<=0.5.0"],
            ["0.4.0     -  0.5.0", "0.4.0 - 0.5.0"],
            ["0.*.0", "0.*.0"],
            ["0.5", "0.5"],
            ["5", "5"],
            ['"0.6.0"', "0.6.0"],
            ["'0.7.0'", "0.7.0"],
            ["*", "*"]
        ];

        for (const [specifier, result] of cases) {
            it(`Returns "${result}" for "${specifier}"`, () => {
                expect(normalizeSpecifier(specifier)).toEqual(result);
            });
        }
    });

    describe("extractSpecifiersFromSource()", () => {
        const cases: Array<[string, string[]]> = [
            [
                `// pragma solidity 0.4.13;
                /* pragma solidity 0.4.14; */
                /*
                    pragma solidity 0.4.15;
                */
                pragma solidity > 0.4.16 < 0.4.20;
                pragma solidity 0.4.17-0.4.19;
                pragma solidity ^0.4.18;
                pragma solidity 0.4.19;
                pragma solidity "^0.8.17";
                pragma solidity '=0.8.18';
                `,
                [">0.4.16 <0.4.20", "0.4.17 - 0.4.19", "^0.4.18", "0.4.19", "^0.8.17", "=0.8.18"]
            ]
        ];

        for (const [source, result] of cases) {
            it(`Returns ${JSON.stringify(result)} for the input`, () => {
                expect(extractSpecifiersFromSource(source)).toEqual(result);
            });
        }
    });
});
