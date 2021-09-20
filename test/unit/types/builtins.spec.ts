import expect from "expect";
import {
    AddressType,
    BoolType,
    BuiltinAddressMembers,
    BuiltinStructType,
    BuiltinSymbols,
    BytesType,
    CompilerVersions,
    DataLocation,
    eq,
    FixedBytesType,
    FunctionStateMutability,
    FunctionType,
    FunctionVisibility,
    getTypeForCompilerVersion,
    IntType,
    LatestCompilerVersion,
    PointerType,
    TypeNode,
    VersionDependentType
} from "../../../src";

const cases: Array<[Map<string, VersionDependentType>, string, string[], TypeNode | undefined]> = [
    [BuiltinSymbols, "abi", ["0.4.13", "0.4.21"], undefined],
    [
        BuiltinSymbols,
        "abi",
        ["0.4.22", LatestCompilerVersion],
        new BuiltinStructType("abi", new Map())
    ],
    [BuiltinSymbols, "bytes", ["0.4.13", "0.8.3"], undefined],
    [
        BuiltinSymbols,
        "bytes",
        ["0.8.4", LatestCompilerVersion],
        new BuiltinStructType("bytes", new Map())
    ],
    [BuiltinSymbols, "block.coinbase", ["0.4.13", LatestCompilerVersion], new AddressType(true)],
    [
        BuiltinSymbols,
        "block.difficulty",
        ["0.4.13", LatestCompilerVersion],
        new IntType(256, false)
    ],
    [BuiltinSymbols, "block.gaslimit", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "block.number", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "block.timestamp", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "block.blockhash", ["0.5.0", LatestCompilerVersion], undefined],
    [
        BuiltinSymbols,
        "block.blockhash",
        ["0.4.13", "0.4.26"],
        new FunctionType(
            undefined,
            [new IntType(256, false)],
            [new FixedBytesType(32)],
            FunctionVisibility.Default,
            FunctionStateMutability.View
        )
    ],
    [BuiltinSymbols, "block.chainid", ["0.4.13", "0.7.6"], undefined],
    [BuiltinSymbols, "block.chainid", ["0.8.0", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "block.basefee", ["0.4.13", "0.8.6"], undefined],
    [BuiltinSymbols, "block.basefee", ["0.8.7", LatestCompilerVersion], new IntType(256, false)],
    [
        BuiltinSymbols,
        "msg.data",
        ["0.4.13", LatestCompilerVersion],
        new PointerType(new BytesType(), DataLocation.CallData)
    ],
    [BuiltinSymbols, "msg.sender", ["0.4.13", LatestCompilerVersion], new AddressType(true)],
    [BuiltinSymbols, "msg.sig", ["0.4.13", LatestCompilerVersion], new FixedBytesType(4)],
    [BuiltinSymbols, "msg.value", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "msg.gas", ["0.5.0", LatestCompilerVersion], undefined],
    [BuiltinSymbols, "msg.gas", ["0.4.13", "0.4.26"], new IntType(256, false)],
    [BuiltinSymbols, "tx.gasprice", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [BuiltinSymbols, "tx.origin", ["0.4.13", LatestCompilerVersion], new AddressType(true)],
    [BuiltinSymbols, "blockhash", ["0.4.13", "0.4.21"], undefined],
    [
        BuiltinSymbols,
        "blockhash",
        ["0.4.22", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new IntType(256, false)],
            [new FixedBytesType(32)],
            FunctionVisibility.Default,
            FunctionStateMutability.View
        )
    ],
    [BuiltinSymbols, "gasleft", ["0.4.13", "0.4.20"], undefined],
    [
        BuiltinSymbols,
        "gasleft",
        ["0.4.21", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [],
            [new IntType(256, false)],
            FunctionVisibility.Default,
            FunctionStateMutability.View
        )
    ],
    [BuiltinSymbols, "now", ["0.7.0", LatestCompilerVersion], undefined],
    [
        BuiltinSymbols,
        "now",
        ["0.4.13", "0.6.12"],
        new FunctionType(
            undefined,
            [],
            [new IntType(256, false)],
            FunctionVisibility.Default,
            FunctionStateMutability.View
        )
    ],
    [
        BuiltinSymbols,
        "addmod",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
            [new IntType(256, false)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [
        BuiltinSymbols,
        "mulmod",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
            [new IntType(256, false)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [
        BuiltinSymbols,
        "keccak256",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(32)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [
        BuiltinSymbols,
        "sha256",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(32)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [
        BuiltinSymbols,
        "ripemd160",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new FixedBytesType(20)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [
        BuiltinSymbols,
        "ecrecover",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [
                new FixedBytesType(32),
                new IntType(8, false),
                new FixedBytesType(32),
                new FixedBytesType(32)
            ],
            [new AddressType(false)],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        )
    ],
    [BuiltinAddressMembers, "balance", ["0.4.13", LatestCompilerVersion], new IntType(256, false)],
    [
        BuiltinAddressMembers,
        "staticcall",
        ["0.4.13", LatestCompilerVersion],
        new FunctionType(
            undefined,
            [new PointerType(new BytesType(), DataLocation.Memory)],
            [new BoolType(), new PointerType(new BytesType(), DataLocation.Memory)],
            FunctionVisibility.Default,
            FunctionStateMutability.View
        )
    ],
    [BuiltinAddressMembers, "code", ["0.4.13", "0.7.6"], undefined],
    [
        BuiltinAddressMembers,
        "code",
        ["0.8.0", LatestCompilerVersion],
        new PointerType(new BytesType(), DataLocation.Memory)
    ]
];

describe("getTypeForCompilerVersion() and builtin types", () => {
    for (const [mapping, accessor, [startVersion, finishVersion], expectation] of cases) {
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

                let result: TypeNode | undefined;
                let members = mapping;

                for (const name of parts) {
                    const typing = members.get(name);

                    if (typing) {
                        result = getTypeForCompilerVersion(typing, version);
                    }

                    if (result instanceof BuiltinStructType) {
                        members = result.members;
                    }
                }

                const condition = expectation ? eq(result, expectation) : result === undefined;

                if (!condition) {
                    misses.push(version);
                }
            }

            expect(misses).toHaveLength(0);
        });
    }
});
