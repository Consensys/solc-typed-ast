import expect from "expect";
import {
    abi,
    address06Builtins,
    addressBuiltins,
    BoolType,
    BuiltinFunctionType,
    BuiltinStructType,
    BytesType,
    CompilerVersions,
    DataLocation,
    eq,
    globalBuiltins,
    LatestCompilerVersion,
    PointerType,
    TRest,
    TypeNode,
    types
} from "../../../src";

const cases: Array<[BuiltinStructType, string, string[], TypeNode | undefined]> = [
    [globalBuiltins, "abi", ["0.4.13", "0.4.21"], undefined],
    [globalBuiltins, "abi", ["0.4.22", LatestCompilerVersion], abi],
    [globalBuiltins, "block.coinbase", ["0.4.13", "0.4.26"], types.address],
    [globalBuiltins, "block.coinbase", ["0.5.0", LatestCompilerVersion], types.addressPayable],
    [globalBuiltins, "block.difficulty", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "block.gaslimit", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "block.number", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "block.timestamp", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "block.blockhash", ["0.5.0", LatestCompilerVersion], undefined],
    [
        globalBuiltins,
        "block.blockhash",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("blockhash", [types.uint256], [types.bytes32])
    ],
    [globalBuiltins, "block.chainid", ["0.4.13", "0.7.6"], undefined],
    [globalBuiltins, "block.chainid", ["0.8.0", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "block.basefee", ["0.4.13", "0.8.6"], undefined],
    [globalBuiltins, "block.basefee", ["0.8.7", LatestCompilerVersion], types.uint256],
    [
        globalBuiltins,
        "msg.data",
        ["0.4.13", LatestCompilerVersion],
        new PointerType(new BytesType(), DataLocation.CallData)
    ],
    [globalBuiltins, "msg.sender", ["0.4.13", "0.4.26"], types.address],
    [globalBuiltins, "msg.sender", ["0.5.0", "0.7.6"], types.addressPayable],
    [globalBuiltins, "msg.sender", ["0.8.0", LatestCompilerVersion], types.address],
    [globalBuiltins, "msg.sig", ["0.4.13", LatestCompilerVersion], types.bytes4],
    [globalBuiltins, "msg.value", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "msg.gas", ["0.5.0", LatestCompilerVersion], undefined],
    [globalBuiltins, "msg.gas", ["0.4.13", "0.4.26"], types.uint256],
    [globalBuiltins, "tx.gasprice", ["0.4.13", LatestCompilerVersion], types.uint256],
    [globalBuiltins, "tx.origin", ["0.4.13", "0.4.26"], types.address],
    [globalBuiltins, "tx.origin", ["0.5.0", "0.7.6"], types.addressPayable],
    [globalBuiltins, "tx.origin", ["0.8.0", LatestCompilerVersion], types.address],
    [globalBuiltins, "blockhash", ["0.4.13", "0.4.21"], undefined],
    [
        globalBuiltins,
        "blockhash",
        ["0.4.22", LatestCompilerVersion],
        new BuiltinFunctionType("blockhash", [types.uint256], [types.bytes32])
    ],
    [globalBuiltins, "gasleft", ["0.4.13", "0.4.20"], undefined],
    [
        globalBuiltins,
        "gasleft",
        ["0.4.21", LatestCompilerVersion],
        new BuiltinFunctionType("gasleft", [], [types.uint256])
    ],
    [
        globalBuiltins,
        "assert",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType("assert", [types.bool], [])
    ],
    [globalBuiltins, "now", ["0.7.0", LatestCompilerVersion], undefined],
    [globalBuiltins, "now", ["0.4.13", "0.6.12"], types.uint256],
    [
        globalBuiltins,
        "addmod",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "addmod",
            [types.uint256, types.uint256, types.uint256],
            [types.uint256]
        )
    ],
    [
        globalBuiltins,
        "mulmod",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "mulmod",
            [types.uint256, types.uint256, types.uint256],
            [types.uint256]
        )
    ],
    [
        globalBuiltins,
        "suicide",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("suicide", [types.address], [])
    ],
    [globalBuiltins, "suicide", ["0.5.0", LatestCompilerVersion], undefined],
    [
        globalBuiltins,
        "selfdestruct",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("selfdestruct", [types.address], [])
    ],
    [
        globalBuiltins,
        "selfdestruct",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType("selfdestruct", [types.addressPayable], [])
    ],
    [
        globalBuiltins,
        "keccak256",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("keccak256", [new TRest("T")], [types.bytes32])
    ],
    [
        globalBuiltins,
        "keccak256",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType("keccak256", [types.bytesMemory], [types.bytes32])
    ],
    [
        globalBuiltins,
        "sha256",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("sha256", [new TRest("T")], [types.bytes32])
    ],
    [
        globalBuiltins,
        "sha256",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType("sha256", [types.bytesMemory], [types.bytes32])
    ],
    [
        globalBuiltins,
        "ripemd160",
        ["0.4.13", "0.4.26"],
        new BuiltinFunctionType("ripemd160", [new TRest("T")], [types.bytes20])
    ],
    [
        globalBuiltins,
        "ripemd160",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType("ripemd160", [types.bytesMemory], [types.bytes20])
    ],
    [
        globalBuiltins,
        "ecrecover",
        ["0.4.13", LatestCompilerVersion],
        new BuiltinFunctionType(
            "ecrecover",
            [types.bytes32, types.uint8, types.bytes32, types.bytes32],
            [types.address]
        )
    ],
    [addressBuiltins, "balance", ["0.4.13", LatestCompilerVersion], types.uint256],
    [
        addressBuiltins,
        "staticcall",
        ["0.5.0", LatestCompilerVersion],
        new BuiltinFunctionType(
            "staticcall",
            [types.bytesMemory],
            [new BoolType(), types.bytesMemory]
        )
    ],
    [addressBuiltins, "code", ["0.4.13", "0.7.6"], undefined],
    [address06Builtins, "code", ["0.8.0", LatestCompilerVersion], types.bytesMemory]
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
