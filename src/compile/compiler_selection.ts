import { bytesToString } from "../misc";
import { CompilerSeries, CompilerVersions } from "./constants";
import { extractSpecifiersFromSource, getCompilerVersionsBySpecifiers } from "./version";

export interface CompilerVersionSelectionStrategy {
    select(): Iterable<string>;
}

export class RangeVersionStrategy implements CompilerVersionSelectionStrategy {
    range: string[];

    constructor(range: string[]) {
        this.range = range;
    }

    select(): Iterable<string> {
        return this.range;
    }
}

export class LatestVersionInEachSeriesStrategy implements CompilerVersionSelectionStrategy {
    descending: boolean;

    constructor(descending = true) {
        this.descending = descending;
    }

    select(): Iterable<string> {
        const series = this.descending ? CompilerSeries.slice(0).reverse() : CompilerSeries;
        const result = [];

        for (const versions of series) {
            const len = versions.length;

            if (len) {
                result.push(versions[len - 1]);
            } else {
                throw new Error("Unable to select compiler version from empty series");
            }
        }

        return result;
    }
}

export class LatestAndFirstVersionInEachSeriesStrategy implements CompilerVersionSelectionStrategy {
    descending: boolean;

    constructor(descending = true) {
        this.descending = descending;
    }

    select(): Iterable<string> {
        const series = this.descending ? CompilerSeries.slice(0).reverse() : CompilerSeries;
        const result = [];

        for (const versions of series) {
            const len = versions.length;

            if (len > 1) {
                result.push(versions[len - 1], versions[0]);
            } else if (len === 1) {
                result.push(versions[len - 1]);
            } else {
                throw new Error("Unable to select compiler version from empty series");
            }
        }

        return result;
    }
}

export class VersionDetectionStrategy implements CompilerVersionSelectionStrategy {
    sources: string[];
    fallback: CompilerVersionSelectionStrategy;
    descending: boolean;

    constructor(
        sources: Uint8Array[],
        fallback: CompilerVersionSelectionStrategy,
        descending = true
    ) {
        this.sources = sources.map(bytesToString);
        this.fallback = fallback;
        this.descending = descending;
    }

    select(): Iterable<string> {
        const specifiers: string[] = [];

        for (const source of this.sources) {
            specifiers.push(...extractSpecifiersFromSource(source));
        }

        if (specifiers.length) {
            const versions = getCompilerVersionsBySpecifiers(specifiers, CompilerVersions);

            if (versions.length) {
                return this.descending ? versions.reverse() : versions;
            }
        }

        return this.fallback.select();
    }
}
