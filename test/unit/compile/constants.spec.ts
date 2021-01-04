import expect from "expect";
import { satisfies } from "semver";
import {
    CompilerSeries,
    CompilerVersions,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    LatestCompilerVersion
} from "../../../src";

describe("Compile version utils", () => {
    it("Compiler 0.4.* versions array is valid", () => {
        expect(CompilerVersions04.length).toBeGreaterThan(0);

        expect(CompilerVersions04.every((v) => satisfies(v, "0.4"))).toBeTruthy();
    });

    it("Compiler 0.5.* versions array is valid", () => {
        expect(CompilerVersions05.length).toBeGreaterThan(0);

        expect(CompilerVersions05.every((v) => satisfies(v, "0.5"))).toBeTruthy();
    });

    it("Compiler 0.6.* versions array is valid", () => {
        expect(CompilerVersions06.length).toBeGreaterThan(0);

        expect(CompilerVersions06.every((v) => satisfies(v, "0.6"))).toBeTruthy();
    });

    it("Compiler 0.7.* versions array is valid", () => {
        expect(CompilerVersions07.length).toBeGreaterThan(0);

        expect(CompilerVersions07.every((v) => satisfies(v, "0.7"))).toBeTruthy();
    });

    it("Compiler 0.8.* versions array is valid", () => {
        expect(CompilerVersions08.length).toBeGreaterThan(0);

        expect(CompilerVersions08.every((v) => satisfies(v, "0.8"))).toBeTruthy();
    });

    it("General supported compiler series array is valid", () => {
        expect(CompilerSeries).toHaveLength(5);

        expect(CompilerSeries).toContain(CompilerVersions04);
        expect(CompilerSeries).toContain(CompilerVersions05);
        expect(CompilerSeries).toContain(CompilerVersions06);
        expect(CompilerSeries).toContain(CompilerVersions07);
        expect(CompilerSeries).toContain(CompilerVersions08);
    });

    it("General supported compiler versions array is valid", () => {
        expect(CompilerVersions).toHaveLength(
            CompilerVersions04.length +
                CompilerVersions05.length +
                CompilerVersions06.length +
                CompilerVersions07.length +
                CompilerVersions08.length
        );

        expect(CompilerVersions).toEqual(expect.arrayContaining(CompilerVersions04));
        expect(CompilerVersions).toEqual(expect.arrayContaining(CompilerVersions05));
        expect(CompilerVersions).toEqual(expect.arrayContaining(CompilerVersions06));
        expect(CompilerVersions).toEqual(expect.arrayContaining(CompilerVersions07));
        expect(CompilerVersions).toEqual(expect.arrayContaining(CompilerVersions08));
    });

    it("Latest compiler version is equal to the last element of general supported compiler versions array", () => {
        expect(LatestCompilerVersion).toEqual(CompilerVersions[CompilerVersions.length - 1]);
    });
});
