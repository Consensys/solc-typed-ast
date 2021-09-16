import { DataLocation, FunctionStateMutability, FunctionVisibility } from "../ast/constants";
import {
    AddressType,
    BoolType,
    BuiltinStructType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntType,
    PointerType
} from "./ast";
import { VersionDependentType } from "./utils";

/**
 * @see https://docs.soliditylang.org/en/latest/units-and-global-variables.html#special-variables-and-functions
 * @see https://github.com/ethereum/solidity/releases/
 */
export const BuiltinSymbols = new Map<string, VersionDependentType>([
    /**
     * @todo Add support for encode(), decode(), encodePacked(), encodeWithSelector(), encodeWithSignature()
     * @see https://github.com/ethereum/solidity/releases/tag/v0.4.22
     */
    ["abi", [new BuiltinStructType("abi", new Map()), ">=0.4.22"]],

    /**
     * @todo Add support for concat()
     * @see https://github.com/ethereum/solidity/releases/tag/v0.8.4
     */
    ["bytes", [new BuiltinStructType("bytes", new Map()), ">=0.8.4"]],
    [
        "block",
        [
            new BuiltinStructType(
                "block",
                new Map<string, VersionDependentType>([
                    ["coinbase", [new AddressType(true), ">=0.4.13"]],
                    ["difficulty", [new IntType(256, false), ">=0.4.13"]],
                    ["gaslimit", [new IntType(256, false), ">=0.4.13"]],
                    ["number", [new IntType(256, false), ">=0.4.13"]],
                    ["timestamp", [new IntType(256, false), ">=0.4.13"]],
                    [
                        "blockhash",
                        [
                            new FunctionType(
                                undefined,
                                [new IntType(256, false)],
                                [new FixedBytesType(32)],
                                FunctionVisibility.Default,
                                FunctionStateMutability.View
                            ),
                            "<0.5.0"
                        ]
                    ],
                    ["chainid", [new IntType(256, false), ">=0.8.0"]],
                    ["basefee", [new IntType(256, false), ">=0.8.7"]]
                ])
            ),
            ">=0.4.13"
        ]
    ],
    [
        "msg",
        [
            new BuiltinStructType(
                "msg",
                new Map<string, VersionDependentType>([
                    ["data", [new PointerType(new BytesType(), DataLocation.CallData), ">=0.4.13"]],
                    ["sender", [new AddressType(true), ">=0.4.13"]],
                    ["sig", [new FixedBytesType(4), ">=0.4.13"]],
                    ["value", [new IntType(256, false), ">=0.4.13"]],
                    ["gas", [new IntType(256, false), "<0.5.0"]]
                ])
            ),
            ">=0.4.13"
        ]
    ],
    [
        "tx",
        [
            new BuiltinStructType(
                "tx",
                new Map<string, VersionDependentType>([
                    ["gasprice", [new IntType(256, false), ">=0.4.13"]],
                    ["origin", [new AddressType(true), ">=0.4.13"]]
                ])
            ),
            ">=0.4.13"
        ]
    ],
    [
        "blockhash",
        [
            new FunctionType(
                undefined,
                [new IntType(256, false)],
                [new FixedBytesType(32)],
                FunctionVisibility.Default,
                FunctionStateMutability.View
            ),
            ">=0.4.13"
        ]
    ],
    [
        "gasleft",
        [
            new FunctionType(
                undefined,
                [],
                [new IntType(256, false)],
                FunctionVisibility.Default,
                FunctionStateMutability.View
            ),
            ">=0.4.13"
        ]
    ],
    [
        "now",
        [
            new FunctionType(
                undefined,
                [],
                [new IntType(256, false)],
                FunctionVisibility.Default,
                FunctionStateMutability.View
            ),
            "<0.7.0"
        ]
    ],
    [
        "addmod",
        [
            new FunctionType(
                undefined,
                [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
                [new IntType(256, false)],
                FunctionVisibility.Default,
                FunctionStateMutability.Pure
            ),
            ">=0.4.13"
        ]
    ],
    [
        "mulmod",
        [
            new FunctionType(
                undefined,
                [new IntType(256, false), new IntType(256, false), new IntType(256, false)],
                [new IntType(256, false)],
                FunctionVisibility.Default,
                FunctionStateMutability.Pure
            ),
            ">=0.4.13"
        ]
    ],
    /**
     * @todo Add support for sha3() and suicide() before Solidity 0.5.0
     * @see https://github.com/ethereum/solidity/releases/tag/v0.5.0
     * @see https://docs.soliditylang.org/en/latest/050-breaking-changes.html
     */
    [
        "keccak256",
        [
            new FunctionType(
                undefined,
                [new PointerType(new BytesType(), DataLocation.Memory)],
                [new FixedBytesType(32)],
                FunctionVisibility.Default,
                FunctionStateMutability.Pure
            ),
            ">=0.4.13"
        ]
    ],
    [
        "sha256",
        [
            new FunctionType(
                undefined,
                [new PointerType(new BytesType(), DataLocation.Memory)],
                [new FixedBytesType(32)],
                FunctionVisibility.Default,
                FunctionStateMutability.Pure
            ),
            ">=0.4.13"
        ]
    ],
    [
        "ripemd160",
        [
            new FunctionType(
                undefined,
                [new PointerType(new BytesType(), DataLocation.Memory)],
                [new FixedBytesType(20)],
                FunctionVisibility.Default,
                FunctionStateMutability.Pure
            ),
            ">=0.4.13"
        ]
    ],
    [
        "ecrecover",
        [
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
            ),
            ">=0.4.13"
        ]
    ]
    /**
     * @todo Add support for revert() and require(). Note their signature changes.
     * @see https://github.com/ethereum/solidity/releases/tag/v0.4.22
     */
]);

export const BuiltinAddressMembers = new Map<string, VersionDependentType>([
    ["balance", [new IntType(256, false), ">=0.4.13"]],
    [
        "staticcall",
        [
            new FunctionType(
                undefined,
                [new PointerType(new BytesType(), DataLocation.Memory)],
                [new BoolType(), new PointerType(new BytesType(), DataLocation.Memory)],
                FunctionVisibility.Default,
                FunctionStateMutability.View
            ),
            ">=0.4.13"
        ]
    ],
    ["code", [new PointerType(new BytesType(), DataLocation.Memory), ">=0.8.0"]]
]);

/**
 * @todo Support type() members: min, max, interfaceId, name, runtimeCode, creationCode
 * @see https://github.com/ethereum/solidity/releases/tag/v0.6.8
 * @see https://github.com/ethereum/solidity/releases/tag/v0.6.7
 * @see https://github.com/ethereum/solidity/releases/tag/v0.5.3
 */
