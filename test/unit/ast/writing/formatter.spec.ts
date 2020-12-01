import expect from "expect";
import { PrettyFormatter, SpacelessFormatter } from "../../../../src";

describe("SpacelessFormatter", () => {
    describe("increaseNesting(), decreaseNesting(), renderIndent()", () => {
        it("Indent rendering is NOT affected by nesting level change", () => {
            const formatter = new SpacelessFormatter();

            expect(formatter.renderIndent()).toEqual("");

            formatter.increaseNesting();

            expect(formatter.renderIndent()).toEqual("");

            formatter.decreaseNesting();

            expect(formatter.renderIndent()).toEqual("");
        });
    });

    describe("renderWrap()", () => {
        it("Returns empty string", () => {
            const formatter = new SpacelessFormatter();

            expect(formatter.renderWrap()).toEqual("");
        });
    });
});

describe("PrettyFormatter", () => {
    describe("increaseNesting(), decreaseNesting(), renderIndent()", () => {
        it("Indent rendering is affected by nesting level change", () => {
            const formatter = new PrettyFormatter(4, 0);

            expect(formatter.renderIndent()).toEqual("");

            formatter.increaseNesting();

            expect(formatter.renderIndent()).toEqual(" ".repeat(4));

            formatter.decreaseNesting();

            expect(formatter.renderIndent()).toEqual("");
        });
    });

    describe("renderWrap()", () => {
        it("Returns new line string", () => {
            const formatter = new PrettyFormatter(4, 0);

            expect(formatter.renderWrap()).toEqual("\n");
        });
    });
});
