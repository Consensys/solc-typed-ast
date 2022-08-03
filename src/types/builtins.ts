import { DataLocation, FunctionStateMutability, FunctionVisibility } from "../ast/constants";
import {
    AddressType,
    BoolType,
    BuiltinFunctionType,
    BuiltinStructType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntType,
    PointerType,
    TRest,
    TVar,
    TypeNameType,
    TypeNode
} from "./ast";
import { types } from "./reserved";
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

    /**
     * @todo Add support for concat()
     * @see https://github.com/ethereum/solidity/releases/tag/v0.8.12
     */
    ["string", [new BuiltinStructType("string", new Map()), ">=0.8.12"]],
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
            ">=0.4.22"
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
            ">=0.4.21"
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
 * Type of the type(T) function when T is an int type
 */
export const type_Int = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "type_Int",
            new Map([
                ["min", [new TVar("T"), ">=0.6.8"]],
                ["max", [new TVar("T"), ">=0.6.8"]]
            ])
        )
    ]
);

/**
 * Type of the type(T) function when T is a contract
 */
export const type_Contract = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "type_Contract",
            new Map([
                ["name", [types.stringMemory, ">=0.5.5"]],
                ["creationCode", [types.bytesMemory, ">=0.5.3"]],
                ["runtimeCode", [types.bytesMemory, ">=0.5.3"]]
            ])
        )
    ]
);

/**
 * Type of the type(T) function when T is an interface
 */
export const type_Interface = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "type_Interface",
            new Map([
                ["name", [types.stringMemory, ">=0.5.5"]],
                ["creationCode", [types.bytesMemory, ">=0.5.3"]],
                ["runtimeCode", [types.bytesMemory, ">=0.5.3"]],
                ["interfaceId", [types.bytes4, ">=0.6.7"]]
            ])
        )
    ]
);

export const abi = new BuiltinStructType(
    "abi",
    new Map([
        /// NOTE: abi.decode is handled as a special case in infer.ts as its not easy to express
        /// as a simple polymorphic function
        [
            "encode",
            [new BuiltinFunctionType("encode", [new TRest("T")], [types.bytesMemory]), ">=0.4.22"]
        ],
        [
            "encodePacked",
            [
                new BuiltinFunctionType("encodePacked", [new TRest("T")], [types.bytesMemory]),
                ">=0.4.22"
            ]
        ],
        [
            "encodeWithSelector",
            [
                new BuiltinFunctionType(
                    "encodeWithSelector",
                    [types.bytes4, new TRest("T")],
                    [types.bytesMemory]
                ),
                ">=0.4.22"
            ]
        ],
        [
            "encodeWithSignature",
            [
                new BuiltinFunctionType(
                    "encodeWithSignature",
                    [types.stringMemory, new TRest("T")],
                    [types.bytesMemory]
                ),
                ">=0.4.22"
            ]
        ],
        [
            "encodeCall",
            [
                new BuiltinFunctionType(
                    "encodeCall",
                    [new TVar("TFunPtr"), new TRest("T")],
                    [types.bytesMemory]
                ),
                ">=0.8.11"
            ]
        ]
    ])
);

export const msg = new BuiltinStructType(
    "msg",
    new Map([
        ["data", [types.bytesCalldata, ">=0.4.13"]],
        ["sender", [types.address, ">=0.4.13"]],
        ["sig", [types.bytes4, ">=0.4.13"]],
        ["value", [types.uint, ">=0.4.13"]],
        ["gas", [types.uint, "<0.5.0"]]
    ])
);

export const block = new BuiltinStructType(
    "block",
    new Map([
        ["chainid", [types.uint, ">=0.8.0"]],
        ["coinbase", [types.addressPayable, ">=0.4.13"]],
        ["basefee", [types.uint, ">=0.8.7"]],
        ["difficulty", [types.uint, ">=0.4.13"]],
        ["gaslimit", [types.uint, ">=0.4.13"]],
        ["number", [types.uint, ">=0.4.13"]],
        ["timestamp", [types.uint, ">=0.4.13"]]
    ])
);

type BuiltinStructTypeField = [string, [TypeNode, string]];
const addressCoreFields: BuiltinStructTypeField[] = [
    ["balance", [types.uint, ">=0.4.13"]],
    ["code", [types.bytesMemory, ">=0.8.0"]],
    ["codehash", [types.bytes32, ">=0.8.0"]]
];

const addressCall04Fields: BuiltinStructTypeField[] = [
    ["call", [new BuiltinFunctionType("call", [types.bytesMemory], [types.bool]), ">=0.4.13"]],
    [
        "delegatecall",
        [new BuiltinFunctionType("delegatecall", [types.bytesMemory], [types.bool]), ">=0.4.13"]
    ],
    [
        "callcode",
        [new BuiltinFunctionType("callcode", [types.bytesMemory], [types.bool]), ">=0.4.13"]
    ]
];

const addressCall05Fields: BuiltinStructTypeField[] = [
    [
        "call",
        [
            new BuiltinFunctionType("call", [types.bytesMemory], [types.bool, types.bytesMemory]),
            ">=0.5.0"
        ]
    ],
    [
        "delegatecall",
        [
            new BuiltinFunctionType(
                "delegatecall",
                [types.bytesMemory],
                [types.bool, types.bytesMemory]
            ),
            ">=0.5.0"
        ]
    ],
    [
        "staticcall",
        [
            new BuiltinFunctionType(
                "staticcall",
                [types.bytesMemory],
                [types.bool, types.bytesMemory]
            ),
            ">=0.5.0"
        ]
    ]
];

const addressPayableFields: BuiltinStructTypeField[] = [
    ["transfer", [new BuiltinFunctionType("transfer", [types.uint], []), ">=0.4.13"]],
    ["send", [new BuiltinFunctionType("send", [types.uint], [types.bool]), ">=0.4.13"]]
];

export const address04Builtins = new BuiltinStructType(
    "address",
    new Map([...addressCoreFields, ...addressCall04Fields, ...addressPayableFields])
);

export const address05Builtins = new BuiltinStructType(
    "address",
    new Map([...addressCoreFields, ...addressCall05Fields, ...addressPayableFields])
);

export const address06Builtins = new BuiltinStructType(
    "address",
    new Map([...addressCoreFields, ...addressCall05Fields, ...addressPayableFields])
);

export const address06PayableBuiltins = new BuiltinStructType(
    "address",
    new Map([...addressCoreFields, ...addressCall05Fields, ...addressPayableFields])
);

export const gasLeftBuiltin = new BuiltinFunctionType("gasleft", [], [types.uint]);

export const blockhashBuiltin = new BuiltinFunctionType("blockhash", [types.uint], [types.bytes32]);
