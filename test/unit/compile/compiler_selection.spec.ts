import expect from "expect";
import {
    CompilerVersions,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    CompilerVersionSelectionStrategy,
    LatestAndFirstVersionInEachSeriesStrategy,
    LatestCompilerVersion,
    LatestVersionInEachSeriesStrategy,
    RangeVersionStrategy,
    stringToBytes,
    VersionDetectionStrategy
} from "../../../src";

describe("RangeVersionStrategy", () => {
    const cases: string[][] = [
        CompilerVersions,
        ["0.4.24", "0.5.10", "0.6.1"],
        [LatestCompilerVersion]
    ];

    describe("select()", () => {
        for (const range of cases) {
            it(`Returns ${JSON.stringify(range)} for "${JSON.stringify(
                range
            )}" in constructor`, () => {
                const strategy = new RangeVersionStrategy(range);

                expect(strategy.select()).toEqual(range);
            });
        }
    });
});

describe("LatestVersionInEachSeriesStrategy", () => {
    const cases: Array<[boolean | undefined, string[]]> = [
        [
            true,
            [
                CompilerVersions08[CompilerVersions08.length - 1],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions04[CompilerVersions04.length - 1]
            ]
        ],
        [
            false,
            [
                CompilerVersions04[CompilerVersions04.length - 1],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions08[CompilerVersions08.length - 1]
            ]
        ],
        [
            undefined,
            [
                CompilerVersions08[CompilerVersions08.length - 1],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions04[CompilerVersions04.length - 1]
            ]
        ]
    ];

    describe("select()", () => {
        for (const [descending, range] of cases) {
            it(`Returns ${JSON.stringify(range)} for "${JSON.stringify(
                descending
            )}" in constructor`, () => {
                const strategy = new LatestVersionInEachSeriesStrategy(descending);

                expect(strategy.select()).toEqual(range);
            });
        }
    });
});

describe("LatestAndFirstVersionInEachSeriesStrategy", () => {
    const cases: Array<[boolean | undefined, string[]]> = [
        [
            true,
            [
                CompilerVersions08[CompilerVersions08.length - 1],
                CompilerVersions08[0],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions07[0],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions06[0],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions05[0],
                CompilerVersions04[CompilerVersions04.length - 1],
                CompilerVersions04[0]
            ]
        ],
        [
            false,
            [
                CompilerVersions04[CompilerVersions04.length - 1],
                CompilerVersions04[0],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions05[0],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions06[0],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions07[0],
                CompilerVersions08[CompilerVersions08.length - 1],
                CompilerVersions08[0]
            ]
        ],
        [
            undefined,
            [
                CompilerVersions08[CompilerVersions08.length - 1],
                CompilerVersions08[0],
                CompilerVersions07[CompilerVersions07.length - 1],
                CompilerVersions07[0],
                CompilerVersions06[CompilerVersions06.length - 1],
                CompilerVersions06[0],
                CompilerVersions05[CompilerVersions05.length - 1],
                CompilerVersions05[0],
                CompilerVersions04[CompilerVersions04.length - 1],
                CompilerVersions04[0]
            ]
        ]
    ];

    describe("select()", () => {
        for (const [descending, range] of cases) {
            it(`Returns ${JSON.stringify(range)} for "${JSON.stringify(
                descending
            )}" in constructor`, () => {
                const strategy = new LatestAndFirstVersionInEachSeriesStrategy(descending);

                expect(strategy.select()).toEqual(range);
            });
        }
    });
});

describe("VersionDetectionStrategy", () => {
    const latestStrategy = new RangeVersionStrategy([LatestCompilerVersion]);
    const cases: Array<[string, CompilerVersionSelectionStrategy, string[]]> = [
        [
            "pragma solidity >0.5.0; pragma solidity <0.5.0; contract Test{}",
            latestStrategy,
            Array.from(latestStrategy.select())
        ],
        [
            "pragma solidity 10000.0.0; contract Test{}",
            latestStrategy,
            Array.from(latestStrategy.select())
        ],
        [
            "pragma solidity >0.4.13 <0.5.0; contract Test{}",
            latestStrategy,
            CompilerVersions04.slice(1).reverse()
        ],
        [
            "pragma solidity >0.4.13; contract Test{}",
            latestStrategy,
            CompilerVersions.slice(1).reverse()
        ],
        ["pragma solidity 0.5.10; contract Test{}", latestStrategy, ["0.5.10"]],
        [
            "pragma solidity <0.6.0; contract Test{}",
            latestStrategy,
            CompilerVersions04.concat(CompilerVersions05).reverse()
        ]
    ];

    describe("select()", () => {
        for (const [source, fallback, range] of cases) {
            it(`Returns ${JSON.stringify(range)} for ${JSON.stringify(source)} and ${
                fallback.constructor.name
            } in constructor`, () => {
                const strategy = new VersionDetectionStrategy([stringToBytes(source)], fallback);

                expect(strategy.select()).toEqual(range);
            });
        }
    });
});
