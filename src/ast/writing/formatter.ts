export interface SourceFormatter {
    increaseNesting(): void;
    decreaseNesting(): void;

    renderIndent(): string;
    renderWrap(): string;
}

export class SpacelessFormatter {
    increaseNesting(): void {
        /**
         * Skip
         */
    }

    decreaseNesting(): void {
        /**
         * Skip
         */
    }

    renderIndent(): string {
        return "";
    }

    renderWrap(): string {
        return "";
    }
}

export class PrettyFormatter implements SourceFormatter {
    private nestingLevel: number;
    private indent: string;

    constructor(indentSize: number, level = 0) {
        this.indent = " ".repeat(indentSize);
        this.nestingLevel = level;
    }

    increaseNesting(): void {
        this.nestingLevel++;
    }

    decreaseNesting(): void {
        this.nestingLevel--;
    }

    renderIndent(): string {
        return this.indent.repeat(this.nestingLevel);
    }

    renderWrap(): string {
        return "\n";
    }
}
