import { expect } from "expect";
import { IntType, pp, smallestFittingType } from "../../../src";

const cases: Array<[bigint, IntType | undefined]> = [
    [0n, new IntType(8, false)],
    [1n, new IntType(8, false)],
    [-1n, new IntType(8, true)],
    [-2n, new IntType(8, true)],
    [-128n, new IntType(8, true)],
    [-129n, new IntType(16, true)],
    [127n, new IntType(8, false)],
    [128n, new IntType(8, false)],
    [255n, new IntType(8, false)],
    [256n, new IntType(16, false)],
    [
        115792089237316195423570985008687907853269984665640564039457584007913129639935n,
        new IntType(256, false)
    ],
    [115792089237316195423570985008687907853269984665640564039457584007913129639936n, undefined],
    [
        57896044618658097711785492504343953926634992332820282019728792003956564819967n,
        new IntType(256, false)
    ],
    [
        -57896044618658097711785492504343953926634992332820282019728792003956564819968n,
        new IntType(256, true)
    ],
    [-57896044618658097711785492504343953926634992332820282019728792003956564819969n, undefined]
];

describe("Smallest fitting type", () => {
    for (const [literal, type] of cases) {
        it(`Smallest type for ${literal.toString()} is ${pp(type)}`, () => {
            const res = smallestFittingType(literal);

            if (res === undefined) {
                expect(type).toBeUndefined();
                return;
            }

            expect(res.pp()).toEqual((type as IntType).pp());
        });
    }
});
