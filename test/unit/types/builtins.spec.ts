import expect from "expect";
import {
    abi,
    address06Builtins,
    addressBuiltins,
    AddressType,
    BoolType,
    BuiltinFunctionType,
    BuiltinStructType,
    BytesType,
    CompilerVersions,
    DataLocation,
    eq,
    FixedBytesType,
    globalBuiltins,
    IntType,
    LatestCompilerVersion,
    PointerType,
    TypeNode,
    types
} from "../../../src";

const cases: Array<[BuiltinStructType, string, string[], TypeNode | undefined]> = [
    [globalBuiltins, "abi", ["0.4.13", "0.4.21"], undefined],
    [globalBuiltins, "abi", ["0.4.22", LatestCompilerVersion], abi],
    [globalBuiltins, "block.coinbase", ["0.4.13", LatestCompilerVersion], new AddressType(true)],
    [
        globalBuiltins,
        "block.difficulty",
        ["0.4.13", LatestCompilerVersion],
        new IntType(256, false)
    ],
    [globalBuiltins, "block.gaslimit", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "block.number", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "block.timestamp", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "block.blockhash", ["0.5.0", LatestCompilerVersion], undefined],
    [
        globalBuiltins,
        "block.blockhash",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("blockhash", [new IntType(256, false)], [new FixedBytesType(32)])
    ],
    [globalBuiltins, "block.chainid", ["0.4.13", "0.7.6"], undefined],
    [globalBuiltins, "block.chainid", ["0.8.0", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "block.basefee", ["0.4.13", "0.8.6"], undefined],
    [globalBuiltins, "block.basefee", ["0.8.7", LatestCompilerVersion], new IntType(256, false)],
    [
        globalBuiltins,
        "msg.data",
        ["0.4.13", LatestCompilerVersion],
        new PointerType(new BytesType(), DataLocation.CallData)
    ],
    [globalBuiltins, "msg.sender", ["0.4.13", "0.5.17"], new AddressType(false)],
    [globalBuiltins, "msg.sender", ["0.6.0", LatestCompilerVersion], new AddressType(true)],
    [globalBuiltins, "msg.sig", ["0.4.13", LatestCompilerVersion], new FixedBytesType(4)],
    [globalBuiltins, "msg.value", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "msg.gas", ["0.5.0", LatestCompilerVersion], undefined],
    [globalBuiltins, "msg.gas", ["0.4.13", "0.4.26"], new IntType(256, false)],
    [globalBuiltins, "tx.gasprice", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [globalBuiltins, "tx.origin", ["0.4.13", LatestCompilerVersion], new AddressType(true)],
    [globalBuiltins, "blockhash", ["0.4.13", "0.4.21"], undefined],
    [
        globalBuiltins,
        "blockhash",
        ["0.4.22", LatestCompilerVersion],
        new BuiltinFunctionType("blockhash", [new IntType(256, false)], [new FixedBytesType(32)])
    ],
    [globalBuiltins, "gasleft", ["0.4.13", "0.4.20"], undefined],
    [
        globalBuiltins,
        "gasleft",
        ["0.4.21", LatestCompilerVersion],
        new BuiltinFunctionType("gasleft", [], [new IntType(256, false)])
    ],
    [globalBuiltins, "now", ["0.7.0", LatestCompilerVersion], undefined],
    [globalBuiltins, "now", ["0.4.13", "0.6.12"], types.uint256],
    [
        globalBuiltins,
        "addmod",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "addmod",
            [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
            [new IntType(256, false)]
        )
    ],
    [
        globalBuiltins,
        "mulmod",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "mulmod",
            [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
            [new IntType(256, false)]
        )
    ],
    [
        globalBuiltins,
        "keccak256",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "keccak256",
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(32)]
        )
    ],
    [
        globalBuiltins,
        "sha256",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "sha256",
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(32)]
        )
    ],
    [
        globalBuiltins,
        "ripemd160",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "ripemd160",
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(20)]
        )
    ],
    [
        globalBuiltins,
        "ecrecover",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "ecrecover",
            [
                new FixedBytesType(32),
                new IntType(8, false),
                new FixedBytesType(32),
                new FixedBytesType(32)
            ],
            [new AddressType(false)]
        )
    ],
    [addressBuiltins, "balance", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [
        addressBuiltins,
        "staticcall",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType(
            "staticcall",
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new BoolType(), new PointerType(new BytesType(), DataLocation.Memory)]
        )
    ],
    [addressBuiltins, "code", ["0.4.13", "0.7.6"], undefined],
    [
        address06Builtins,
        "code",
        ["0.8.0", LatestCompilerVersion],
        new PointerType(new BytesType(), DataLocation.Memory)
    ]
];

describe("getTypeForCompilerVersion() and builtin types", () => {
    for (const [struct, accessor, [startVersion, finishVersion], expectation] of cases) {
        it(`${accessor} is ${
            expectation ? expectation.pp() : undefined
        } since ${startVersion} up to ${finishVersion}`, () => {
            const start = CompilerVersions.indexOf(startVersion);
            const finish = CompilerVersions.indexOf(finishVersion);

            expect(start).toBeGreaterThan(-1);
            expect(finish).toBeGreaterThan(-1);

            const versions = CompilerVersions.slice(start, finish + 1);

            const misses: string[] = [];

            for (const version of versions) {
                const parts = accessor.split(".");

                let curType: TypeNode | undefined = struct;

                for (let i = 0; i < parts.length; i++) {
                    const name = parts[i];
                    curType = (curType as BuiltinStructType).getFieldForVersion(name, version);

                    if (i < parts.length - 1) {
                        expect(curType instanceof BuiltinStructType).toBeTruthy();
                    }
                }

                const condition = expectation ? eq(curType, expectation) : curType === undefined;

                if (!condition) {
                    misses.push(version);
                }
            }

            expect(misses).toHaveLength(0);
        });
    }
});
