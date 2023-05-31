import expect from "expect";
import { fastParseBytecodeSourceMapping, parseBytecodeSourceMapping } from "../../../src";

const samples: string[] = [
    "29071:3352:71:-:0;;;1572:26:47;;;-1:-1:-1;;1572:26:47;1594:4;1572:26;;;29071:3352:71;;;;;;;;;;;;;;;;",
    "8223:2087:74:-:0;;;8278:61;;;;;;;;;-1:-1:-1;8302:14:74;:30;;-1:-1:-1;;;;;;8302:30:74;8327:4;8302:30;;;8223:2087;;;;;;",
    "23093:1079:71:-:0;;;1572:26:47;;;-1:-1:-1;;1572:26:47;1594:4;1572:26;;;23093:1079:71;;;;;;;;;;;;;;;;",
    "5343:1530:78:-:0;;;;;;;;;;;;;;;;;;;"
];

describe("Source map parsing tests", () => {
    for (const sample of samples) {
        it(sample, () => {
            const common = parseBytecodeSourceMapping(sample);
            const fast = fastParseBytecodeSourceMapping(sample);

            expect(common.length).toEqual(fast.length);

            for (let i = 0; i < common.length; i++) {
                expect(common[i].start).toEqual(fast[i].start);
                expect(common[i].length).toEqual(fast[i].length);
                expect(common[i].jump).toEqual(fast[i].jump);
                expect(common[i].sourceIndex).toEqual(fast[i].sourceIndex);
            }
        });
    }
});
