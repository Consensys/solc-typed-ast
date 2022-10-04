import { expect } from "expect";
import { IntType, pp, smallestFittingType } from "../../../src";

const cases: Array<[bigint, IntType | undefined]> = [
    [BigInt(0), new IntType(8, false)],
    [BigInt(1), new IntType(8, false)],
    [BigInt(-1), new IntType(8, true)],
    [BigInt(-2), new IntType(8, true)],
    [BigInt(-128), new IntType(8, true)],
    [BigInt(-129), new IntType(16, true)],
    [BigInt(127), new IntType(8, false)],
    [BigInt(128), new IntType(8, false)],
    [BigInt(255), new IntType(8, false)],
    [BigInt(256), new IntType(16, false)],
    [
        BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"),
        new IntType(256, false)
    ],
    [
        BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639936"),
        undefined
    ],
    [
        BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819967"),
        new IntType(256, false)
    ],
    [
        BigInt("-57896044618658097711785492504343953926634992332820282019728792003956564819968"),
        new IntType(256, true)
    ],
    [
        BigInt("-57896044618658097711785492504343953926634992332820282019728792003956564819969"),
        undefined
    ]
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
