import {
    AddressType,
    BuiltinFunctionType,
    BuiltinStructType,
    IntType,
    TRest,
    TVar,
    TypeNameType,
    TypeNode,
    YulBuiltinFunctionType
} from "./ast";
import { types, yulTypes } from "./reserved";

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
                ["runtimeCode", [[types.bytesMemory, ">=0.5.3"]]],
                ["interfaceId", [[types.bytes4, ">=0.6.7"]]]
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
                        [new AddressType(false)]
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

export const yulBuiltins = new BuiltinStructType(
    "<yul_builtins>",
    new Map([
        ["stop", [[new YulBuiltinFunctionType("stop", [], []), ">=0.3.1"]]],
        [
            "add",
            [
                [
                    new YulBuiltinFunctionType(
                        "add",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "sub",
            [
                [
                    new YulBuiltinFunctionType(
                        "sub",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "mul",
            [
                [
                    new YulBuiltinFunctionType(
                        "mul",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "div",
            [
                [
                    new YulBuiltinFunctionType(
                        "div",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "sdiv",
            [
                [
                    new YulBuiltinFunctionType(
                        "sdiv",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "mod",
            [
                [
                    new YulBuiltinFunctionType(
                        "mod",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "smod",
            [
                [
                    new YulBuiltinFunctionType(
                        "smod",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "exp",
            [
                [
                    new YulBuiltinFunctionType(
                        "exp",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        ["not", [[new YulBuiltinFunctionType("not", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "lt",
            [
                [
                    new YulBuiltinFunctionType(
                        "lt",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "gt",
            [
                [
                    new YulBuiltinFunctionType(
                        "gt",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "slt",
            [
                [
                    new YulBuiltinFunctionType(
                        "slt",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "sgt",
            [
                [
                    new YulBuiltinFunctionType(
                        "sgt",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "eq",
            [
                [
                    new YulBuiltinFunctionType(
                        "eq",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "iszero",
            [[new YulBuiltinFunctionType("iszero", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]
        ],
        [
            "and",
            [
                [
                    new YulBuiltinFunctionType(
                        "and",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "or",
            [
                [
                    new YulBuiltinFunctionType(
                        "or",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "xor",
            [
                [
                    new YulBuiltinFunctionType(
                        "xor",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "byte",
            [
                [
                    new YulBuiltinFunctionType(
                        "byte",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "shl",
            [
                [
                    new YulBuiltinFunctionType(
                        "shl",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "shr",
            [
                [
                    new YulBuiltinFunctionType(
                        "shr",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "sar",
            [
                [
                    new YulBuiltinFunctionType(
                        "sar",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "addmod",
            [
                [
                    new YulBuiltinFunctionType(
                        "addmod",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "mulmod",
            [
                [
                    new YulBuiltinFunctionType(
                        "mulmod",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "signextend",
            [
                [
                    new YulBuiltinFunctionType(
                        "signextend",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "keccak256",
            [
                [
                    new YulBuiltinFunctionType(
                        "keccak256",
                        [yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        ["pc", [[new YulBuiltinFunctionType("pc", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["pop", [[new YulBuiltinFunctionType("pop", [yulTypes.u256], []), ">=0.3.1"]]],
        [
            "mload",
            [[new YulBuiltinFunctionType("mload", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]
        ],
        [
            "mstore",
            [[new YulBuiltinFunctionType("mstore", [yulTypes.u256, yulTypes.u256], []), ">=0.3.1"]]
        ],
        [
            "mstore8",
            [[new YulBuiltinFunctionType("mstore8", [yulTypes.u256, yulTypes.u256], []), ">=0.3.1"]]
        ],
        [
            "sload",
            [[new YulBuiltinFunctionType("sload", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]
        ],
        [
            "sstore",
            [[new YulBuiltinFunctionType("sstore", [yulTypes.u256, yulTypes.u256], []), ">=0.3.1"]]
        ],
        ["msize", [[new YulBuiltinFunctionType("msize", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["gas", [[new YulBuiltinFunctionType("gas", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["address", [[new YulBuiltinFunctionType("address", [], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "balance",
            [[new YulBuiltinFunctionType("balance", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]
        ],
        [
            "selfbalance",
            [[new YulBuiltinFunctionType("selfbalance", [], [yulTypes.u256]), ">=0.5.12"]]
        ],
        ["caller", [[new YulBuiltinFunctionType("caller", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["callvalue", [[new YulBuiltinFunctionType("callvalue", [], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "calldataload",
            [
                [
                    new YulBuiltinFunctionType("calldataload", [yulTypes.u256], [yulTypes.u256]),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "calldatasize",
            [[new YulBuiltinFunctionType("calldatasize", [], [yulTypes.u256]), ">=0.3.1"]]
        ],
        [
            "calldatacopy",
            [
                [
                    new YulBuiltinFunctionType(
                        "calldatacopy",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        ["codesize", [[new YulBuiltinFunctionType("codesize", [], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "codecopy",
            [
                [
                    new YulBuiltinFunctionType(
                        "codecopy",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "extcodesize",
            [
                [
                    new YulBuiltinFunctionType("extcodesize", [yulTypes.u256], [yulTypes.u256]),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "extcodecopy",
            [
                [
                    new YulBuiltinFunctionType(
                        "extcodecopy",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "returndatasize",
            [[new YulBuiltinFunctionType("returndatasize", [], [yulTypes.u256]), ">=0.4.12"]]
        ],
        [
            "returndatacopy",
            [
                [
                    new YulBuiltinFunctionType(
                        "returndatacopy",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.4.12"
                ]
            ]
        ],
        [
            "extcodehash",
            [
                [
                    new YulBuiltinFunctionType("extcodehash", [yulTypes.u256], [yulTypes.u256]),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "create",
            [
                [
                    new YulBuiltinFunctionType(
                        "create",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "create2",
            [
                [
                    new YulBuiltinFunctionType(
                        "create2",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        [yulTypes.u256]
                    ),
                    ">=0.4.22"
                ]
            ]
        ],
        [
            "call",
            [
                [
                    new YulBuiltinFunctionType(
                        "call",
                        [
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256
                        ],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "callcode",
            [
                [
                    new YulBuiltinFunctionType(
                        "callcode",
                        [
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256
                        ],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "delegatecall",
            [
                [
                    new YulBuiltinFunctionType(
                        "delegatecall",
                        [
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256
                        ],
                        [yulTypes.u256]
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "staticcall",
            [
                [
                    new YulBuiltinFunctionType(
                        "staticcall",
                        [
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256
                        ],
                        [yulTypes.u256]
                    ),
                    ">=0.4.12"
                ]
            ]
        ],
        [
            "return",
            [[new YulBuiltinFunctionType("return", [yulTypes.u256, yulTypes.u256], []), ">=0.3.1"]]
        ],
        [
            "revert",
            [[new YulBuiltinFunctionType("revert", [yulTypes.u256, yulTypes.u256], []), ">=0.4.12"]]
        ],
        [
            "selfdestruct",
            [[new YulBuiltinFunctionType("selfdestruct", [yulTypes.u256], []), ">=0.3.1"]]
        ],
        ["invalid", [[new YulBuiltinFunctionType("invalid", [], []), ">=0.3.1"]]],
        [
            "log0",
            [[new YulBuiltinFunctionType("log0", [yulTypes.u256, yulTypes.u256], []), ">=0.3.1"]]
        ],
        [
            "log1",
            [
                [
                    new YulBuiltinFunctionType(
                        "log1",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "log2",
            [
                [
                    new YulBuiltinFunctionType(
                        "log2",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "log3",
            [
                [
                    new YulBuiltinFunctionType(
                        "log3",
                        [yulTypes.u256, yulTypes.u256, yulTypes.u256, yulTypes.u256, yulTypes.u256],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        [
            "log4",
            [
                [
                    new YulBuiltinFunctionType(
                        "log4",
                        [
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256,
                            yulTypes.u256
                        ],
                        []
                    ),
                    ">=0.3.1"
                ]
            ]
        ],
        ["chainid", [[new YulBuiltinFunctionType("chainid", [], [yulTypes.u256]), ">=0.5.12"]]],
        ["basefee", [[new YulBuiltinFunctionType("basefee", [], [yulTypes.u256]), ">=0.8.7"]]],
        ["origin", [[new YulBuiltinFunctionType("origin", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["gasprice", [[new YulBuiltinFunctionType("gasprice", [], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "blockhash",
            [[new YulBuiltinFunctionType("blockhash", [yulTypes.u256], [yulTypes.u256]), ">=0.3.1"]]
        ],
        ["coinbase", [[new YulBuiltinFunctionType("coinbase", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["timestamp", [[new YulBuiltinFunctionType("timestamp", [], [yulTypes.u256]), ">=0.3.1"]]],
        ["number", [[new YulBuiltinFunctionType("number", [], [yulTypes.u256]), ">=0.3.1"]]],
        [
            "difficulty",
            [[new YulBuiltinFunctionType("difficulty", [], [yulTypes.u256]), ">=0.3.1"]]
        ],
        ["gaslimit", [[new YulBuiltinFunctionType("gaslimit", [], [yulTypes.u256]), ">=0.3.1"]]]
    ])
);
