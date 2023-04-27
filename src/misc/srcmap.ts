export type DecodedBytecodeSourceMapEntry = {
    start: number;
    length: number;
    sourceIndex: number;
    jump: "i" | "o" | "-" | undefined;
};

export function fastParseBytecodeSourceMapping(sourceMap: string): DecodedBytecodeSourceMapEntry[] {
    const res: DecodedBytecodeSourceMapEntry[] = [];
    let curNum: number | undefined = undefined;
    let elIdx = 0;

    let sign = 1;
    let start = 0;
    let length = 0;
    let sourceIndex = 0;
    let jump: "i" | "o" | "-" | undefined;

    for (let i = 0; i < sourceMap.length; i++) {
        const c = sourceMap.charCodeAt(i);

        if (c === 45 /*-*/) {
            sign = -1;
        }

        if (c == 59 /*;*/ || c == 58 /*:*/) {
            if (curNum !== undefined) {
                if (elIdx === 0) {
                    start = sign * curNum;
                } else if (elIdx === 1) {
                    length = sign * curNum;
                } else if (elIdx === 2) {
                    sourceIndex = sign * curNum;
                }
            }

            curNum = undefined;
            sign = 1;

            if (c == 59 /*;*/) {
                res.push({
                    start,
                    length,
                    sourceIndex,
                    jump
                });

                elIdx = 0;
            } else {
                elIdx++;
            }

            continue;
        }

        // jump specifier
        if (c == 105 /*i*/ || c == 111 /*o*/ || c == 45 /*-*/) {
            jump = String.fromCharCode(c) as "i" | "o" | "-";
            continue;
        }

        // Must be a digit
        const digit = c - 48; /*0*/
        curNum = curNum === undefined ? digit : curNum * 10 + digit;
    }

    res.push({
        start,
        length,
        sourceIndex,
        jump
    });

    return res;
}

/**
 * @see https://ethereum.stackexchange.com/a/26216 for the original implementation
 */
export function parseBytecodeSourceMapping(sourceMap: string): DecodedBytecodeSourceMapEntry[] {
    return sourceMap
        .split(";")
        .map((chunk) => chunk.split(":"))
        .map(([start, length, sourceIndex, jump]) => ({
            start: start === "" ? undefined : start,
            length: length === "" ? undefined : length,
            sourceIndex: sourceIndex === "" ? undefined : sourceIndex,
            jump: jump === "" ? undefined : jump
        }))
        .reduce(
            ([previous, ...all], entry) => [
                {
                    start: parseInt(entry.start || previous.start, 10),
                    length: parseInt(entry.length || previous.length, 10),
                    sourceIndex: parseInt(entry.sourceIndex || previous.sourceIndex, 10),
                    jump: entry.jump || previous.jump
                },
                previous,
                ...all
            ],
            [{} as any]
        )
        .reverse()
        .slice(1);
}
