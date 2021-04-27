export function forAll<T>(arr: T[] | Set<T>, cb: (arg0: T) => boolean): boolean {
    for (const el of arr) {
        if (!cb(el)) {
            return false;
        }
    }

    return true;
}
