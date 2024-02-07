import {
    BuiltinFunctionType,
    BuiltinStructType,
    IntType,
    TRest,
    TVar,
    TypeNameType,
    TypeNode
} from "./ast";
import { types } from "./reserved";

export type VersionDependentType = [TypeNode, string];

/**
 * Type of the type(T) function when T is an int type
 */
export const typeInt = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "typeInt",
            new Map([
                ["min", [[new TVar("T"), ">=0.6.8"]]],
                ["max", [[new TVar("T"), ">=0.6.8"]]]
            ])
        )
    ]
);

/**
 * Type of the type(T) function when T is a contract
 */
export const typeContract = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "typeContract",
            new Map([
                ["name", [[types.stringMemory, ">=0.5.5"]]],
                ["creationCode", [[types.bytesMemory, ">=0.5.3"]]],
                ["runtimeCode", [[types.bytesMemory, ">=0.5.3"]]]
            ])
        )
    ]
);

/**
 * Type of the type(T) function when T is an interface
 */
export const typeInterface = new BuiltinFunctionType(
    "type",
    [new TypeNameType(new TVar("T"))],
    [
        new BuiltinStructType(
            "typeInterface",
            new Map([
                ["name", [[types.stringMemory, ">=0.5.5"]]],
                ["creationCode", [[types.bytesMemory, ">=0.5.3"]]],
                ["runtimeCode", [[types.bytesMemory, ">=0.5.3"]]],
                ["interfaceId", [[types.bytes4, ">=0.6.7"]]]
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
            [[new BuiltinFunctionType("encode", [new TRest("T")], [types.bytesMemory]), ">=0.4.22"]]
        ],
        [
            "encodePacked",
            [
                [
                    new BuiltinFunctionType("encodePacked", [new TRest("T")], [types.bytesMemory]),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "encodeWithSelector",
            [
                [
                    new BuiltinFunctionType(
                        "encodeWithSelector",
                        [types.bytes4, new TRest("T")],
                        [types.bytesMemory]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "encodeWithSignature",
            [
                [
                    new BuiltinFunctionType(
                        "encodeWithSignature",
                        [types.stringMemory, new TRest("T")],
                        [types.bytesMemory]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "encodeCall",
            [
                [
                    new BuiltinFunctionType(
                        "encodeCall",
                        [new TVar("TFunPtr"), new TRest("T")],
                        [types.bytesMemory]
                    ),
                    ">=0.8.11"
                ]
            ]
        ]
    ])
);

export const msg = new BuiltinStructType(
    "msg",
    new Map([
        ["data", [[types.bytesCalldata, ">=0.4.13"]]],
        [
            "sender",
            [
                [types.address, "<0.5.0"],
                [types.address, ">=0.8.0"],
                [types.addressPayable, ">=0.5.0 <0.8.0"]
            ]
        ],
        ["sig", [[types.bytes4, ">=0.4.13"]]],
        ["value", [[types.uint256, ">=0.4.13"]]],
        ["gas", [[types.uint256, "<0.5.0"]]]
    ])
);

export const block = new BuiltinStructType(
    "block",
    new Map([
        ["chainid", [[types.uint256, ">=0.8.0"]]],
        [
            "coinbase",
            [
                [types.address, "<0.5.0"],
                [types.addressPayable, ">=0.5.0"]
            ]
        ],
        ["basefee", [[types.uint256, ">=0.8.7"]]],
        ["blobbasefee", [[types.uint256, ">=0.8.24"]]],
        ["difficulty", [[types.uint256, ">=0.4.13"]]],
        ["gaslimit", [[types.uint256, ">=0.4.13"]]],
        ["number", [[types.uint256, ">=0.4.13"]]],
        [
            "blockhash",
            [[new BuiltinFunctionType("blockhash", [types.uint256], [types.bytes32]), "<0.5.0"]]
        ],
        ["timestamp", [[types.uint256, ">=0.4.13"]]]
    ])
);

export const tx = new BuiltinStructType(
    "tx",
    new Map<string, VersionDependentType[]>([
        ["gasprice", [[new IntType(256, false), ">=0.4.13"]]],
        [
            "origin",
            [
                [types.address, "<0.5.0"],
                [types.address, ">=0.8.0"],
                [types.addressPayable, ">=0.5.0 <0.8.0"]
            ]
        ]
    ])
);

type BuiltinStructTypeField = [string, Array<[TypeNode, string]>];

const addressFields: BuiltinStructTypeField[] = [
    ["balance", [[types.uint256, ">=0.4.13"]]],
    ["code", [[types.bytesMemory, ">=0.8.0"]]],
    ["codehash", [[types.bytes32, ">=0.8.0"]]],
    [
        "delegatecall",
        [
            [new BuiltinFunctionType("delegatecall", [new TRest("T")], [types.bool]), "<0.5.0"],
            [
                new BuiltinFunctionType(
                    "delegatecall",
                    [types.bytesMemory],
                    [types.bool, types.bytesMemory]
                ),
                ">=0.5.0"
            ]
        ]
    ],
    ["callcode", [[new BuiltinFunctionType("callcode", [new TRest("T")], [types.bool]), "<0.5.0"]]],
    [
        "call",
        [
            [new BuiltinFunctionType("call", [new TRest("T")], [types.bool]), "<0.5.0"],
            [
                new BuiltinFunctionType(
                    "call",
                    [types.bytesMemory],
                    [types.bool, types.bytesMemory]
                ),
                ">=0.5.0"
            ]
        ]
    ],
    [
        "staticcall",
        [
            [
                new BuiltinFunctionType(
                    "staticcall",
                    [types.bytesMemory],
                    [types.bool, types.bytesMemory]
                ),
                ">=0.5.0"
            ]
        ]
    ]
];

const addressPayableFields: BuiltinStructTypeField[] = [
    ["transfer", [[new BuiltinFunctionType("transfer", [types.uint256], []), ">=0.4.13"]]],
    ["send", [[new BuiltinFunctionType("send", [types.uint256], [types.bool]), ">=0.4.13"]]]
];

export const addressBuiltins = new BuiltinStructType(
    "address",
    new Map([...addressFields, ...addressPayableFields])
);

export const address06Builtins = new BuiltinStructType(
    "address",
    new Map([...addressFields, ...addressPayableFields])
);

export const address06PayableBuiltins = new BuiltinStructType(
    "address",
    new Map([...addressFields, ...addressPayableFields])
);

export const globalBuiltins = new BuiltinStructType(
    "<global_builtins>",
    new Map([
        ["abi", [[abi, ">=0.4.22"]]],
        ["block", [[block, ">=0.4.13"]]],
        ["tx", [[tx, ">=0.4.13"]]],
        ["msg", [[msg, ">=0.4.13"]]],
        ["gasleft", [[new BuiltinFunctionType("gasleft", [], [types.uint256]), ">=0.4.21"]]],
        [
            "blockhash",
            [[new BuiltinFunctionType("blockhash", [types.uint256], [types.bytes32]), ">=0.4.22"]]
        ],
        [
            "blobhash",
            [[new BuiltinFunctionType("blobhash", [types.uint256], [types.bytes32]), ">=0.8.24"]]
        ],
        ["assert", [[new BuiltinFunctionType("assert", [types.bool], []), ">=0.4.13"]]],
        ["now", [[types.uint256, "<0.7.0"]]],
        [
            "addmod",
            [
                [
                    new BuiltinFunctionType(
                        "addmod",
                        [types.uint256, types.uint256, types.uint256],
                        [types.uint256]
                    ),
                    ">=0.4.13"
                ]
            ]
        ],
        [
            "mulmod",
            [
                [
                    new BuiltinFunctionType(
                        "mulmod",
                        [types.uint256, types.uint256, types.uint256],
                        [types.uint256]
                    ),
                    ">=0.4.13"
                ]
            ]
        ],
        ["suicide", [[new BuiltinFunctionType("suicide", [types.address], []), "<0.5.0"]]],
        [
            "selfdestruct",
            [
                [new BuiltinFunctionType("selfdestruct", [types.address], []), "<0.5.0"],
                [new BuiltinFunctionType("selfdestruct", [types.addressPayable], []), ">=0.5.0"]
            ]
        ],
        ["sha3", [[new BuiltinFunctionType("sha3", [new TRest("T")], [types.bytes32]), "<0.5.0"]]],
        [
            "keccak256",
            [
                [new BuiltinFunctionType("keccak256", [new TRest("T")], [types.bytes32]), "<0.5.0"],
                [
                    new BuiltinFunctionType("keccak256", [types.bytesMemory], [types.bytes32]),
                    ">=0.5.0"
                ]
            ]
        ],
        [
            "sha256",
            [
                [new BuiltinFunctionType("sha256", [new TRest("T")], [types.bytes32]), "<0.5.0"],
                [new BuiltinFunctionType("sha256", [types.bytesMemory], [types.bytes32]), ">=0.5.0"]
            ]
        ],
        [
            "ripemd160",
            [
                [new BuiltinFunctionType("ripemd160", [new TRest("T")], [types.bytes20]), "<0.5.0"],
                [
                    new BuiltinFunctionType("ripemd160", [types.bytesMemory], [types.bytes20]),
                    ">=0.5.0"
                ]
            ]
        ],
        [
            "ecrecover",
            [
                [
                    new BuiltinFunctionType(
                        "ecrecover",
                        [types.bytes32, types.uint8, types.bytes32, types.bytes32],
                        [types.address]
                    ),
                    ">=0.4.13"
                ]
            ]
        ],
        ["log0", [[new BuiltinFunctionType("log0", [types.bytes32], []), "<0.8.0"]]],
        ["log1", [[new BuiltinFunctionType("log1", [types.bytes32, types.bytes32], []), "<0.8.0"]]],
        [
            "log2",
            [
                [
                    new BuiltinFunctionType(
                        "log2",
                        [types.bytes32, types.bytes32, types.bytes32],
                        []
                    ),
                    "<0.8.0"
                ]
            ]
        ],
        [
            "log3",
            [
                [
                    new BuiltinFunctionType(
                        "log3",
                        [types.bytes32, types.bytes32, types.bytes32, types.bytes32],
                        []
                    ),
                    "<0.8.0"
                ]
            ]
        ],
        [
            "log4",
            [
                [
                    new BuiltinFunctionType(
                        "log4",
                        [types.bytes32, types.bytes32, types.bytes32, types.bytes32, types.bytes32],
                        []
                    ),
                    "<0.8.0"
                ]
            ]
        ]
    ])
);
