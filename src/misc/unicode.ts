const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function toUTF8(buf: Uint8Array): string {
    return decoder.decode(buf);
}

export function fromUTF8(str: string): Uint8Array {
    return encoder.encode(str);
}

export function strByteLen(str: string): number {
    return fromUTF8(str).length;
}
