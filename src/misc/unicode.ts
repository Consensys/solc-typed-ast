const utf8Enc = new TextEncoder();
const utf8Dec = new TextDecoder();
const scratch = new Uint8Array(4);

/**
 * Convert a UTF-8 encoded bytes into a JS UTF-16 string
 */
export function bytesToString(buf: Uint8Array): string {
    return utf8Dec.decode(buf);
}

/**
 * Convert JS UTF-16 string into UTF-8 encoded bytes
 */
export function stringToBytes(str: string): Uint8Array {
    return utf8Enc.encode(str);
}

/**
 * Compute the length of a JS string when encoded as UTF-8 bytes
 */
export function strUTF8Len(s: string): number {
    let len = 0;
    for (const ch of s) {
        len += utf8Enc.encodeInto(ch, scratch).written;
    }

    return len;
}

/**
 * Given a JS string `s` and an index `idx` of a character in it, compute the
 * corresponding byte offset of the character in the UTF-8 encoding of the
 * string.
 */
export function strUTF16IndexToUTF8Offset(s: string, idx: number): number {
    let i = 0,
        off = 0;

    for (const ch of s) {
        if (i === idx) {
            return off;
        }

        const charBytes = utf8Enc.encodeInto(ch, scratch).written;

        i += charBytes <= 2 ? 1 : 2;
        off += charBytes;

        if (i === idx) {
            return off;
        }

        if (i >= idx) {
            throw new Error(`No unicode character index ${idx} in string ${s}.`);
        }
    }

    if (i === idx) {
        return off;
    }

    throw new Error(`No unicode character index ${idx} in string ${s}.`);
}
