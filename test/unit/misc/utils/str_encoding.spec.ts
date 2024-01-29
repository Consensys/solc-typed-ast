import { strUTF16IndexToUTF8Offset } from "../../../../src";

describe("strUTF16IndexToUTF8Offset()", () => {
    const cases: Array<[string, number[], number[]]> = [
        ["abcdef", [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]],
        ["x😀y🍿z", [0, 1, 3, 4, 6], [0, 1, 5, 6, 10]],
        ["🚀 😀", [0, 2, 3], [0, 4, 5]]
    ];

    for (const [sample, u16s, u8s] of cases) {
        it(`"${sample}"`, () => {
            for (let i = 0; i < u16s.length; i++) {
                const u16 = u16s[i];
                const u8 = u8s[i];

                expect(strUTF16IndexToUTF8Offset(sample, u16)).toEqual(u8);
            }
        });
    }
});
