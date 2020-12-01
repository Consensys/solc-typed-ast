import expect from "expect";
import { ASTNodeFactory, Coordinates, Location } from "../../../src";

describe("Location", () => {
    it("constructor()", () => {
        const location = new Location("path/to/file.sol", "1:2:0");

        expect(location.fileName).toEqual("path/to/file.sol");
        expect(location.src).toEqual("1:2:0");
    });

    describe("createForNode()", () => {
        it("Works properly for node with SourceUnit root", () => {
            const factory = new ASTNodeFactory();
            const unit = factory.makeSourceUnit("file.sol", 0, "path/to/file.sol", new Map());
            const directive = factory.makePragmaDirective(["solidity", "0.5", ".0"]);

            unit.src = "0:26:0";
            directive.src = "4:22:0";

            unit.appendChild(directive);

            const dl = Location.createForNode(directive);

            expect(dl).toBeInstanceOf(Location);
            expect(dl.fileName).toEqual("file.sol");
            expect(dl.src).toEqual("4:22:0");

            const sl = Location.createForNode(unit);

            expect(sl).toBeInstanceOf(Location);
            expect(sl.fileName).toEqual("file.sol");
            expect(sl.src).toEqual("0:26:0");
        });

        it("Throws an error for node without SourceUnit root", () => {
            const factory = new ASTNodeFactory();
            const directive = factory.makePragmaDirective(["solidity", "0.5", ".0"]);

            directive.src = "4:22:0";

            expect(() => Location.createForNode(directive)).toThrow();
        });
    });

    describe("getCoordinates()", () => {
        const fileName = "dummy.sol";
        const source = [
            "pragma solidity 0.5.0;",
            "",
            "contract Test {",
            "    uint a = 1;",
            "}",
            ""
        ].join("\n");

        const cases: Array<[string, Coordinates]> = [
            [
                "0:0:0",
                {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 0 }
                }
            ],
            [
                "0:59:0",
                {
                    start: { line: 1, column: 0 },
                    end: { line: 6, column: 0 }
                }
            ],
            [
                "0:22:0",
                {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 22 }
                }
            ],
            [
                "24:33:0",
                {
                    start: { line: 3, column: 0 },
                    end: { line: 5, column: 1 }
                }
            ],
            [
                "44:10:0",
                {
                    start: { line: 4, column: 4 },
                    end: { line: 4, column: 14 }
                }
            ],
            [
                "44:4:0",
                {
                    start: { line: 4, column: 4 },
                    end: { line: 4, column: 8 }
                }
            ],
            [
                "53:1:0",
                {
                    start: { line: 4, column: 13 },
                    end: { line: 4, column: 14 }
                }
            ]
        ];

        for (const [src, coords] of cases) {
            it(`Returns ${JSON.stringify(coords)} for src ${src} and supplied content`, () => {
                const location = new Location(fileName, src);

                expect(location.getCoordinates(source)).toEqual(coords);
            });
        }

        it("Returns zeroed coordinates for undefined content", () => {
            const location = new Location("path/to/file.sol", "1:2:0");

            expect(location.getCoordinates(undefined)).toEqual({
                start: { line: 0, column: 0 },
                end: { line: 0, column: 0 }
            });
        });
    });
});
