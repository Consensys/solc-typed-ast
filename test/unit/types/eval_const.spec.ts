import Decimal from "decimal.js";
import { expect } from "expect";
import {
    ASTNodeFactory,
    DataLocation,
    EtherUnit,
    evalConstantExpr,
    Expression,
    FunctionCallKind,
    InferType,
    isConstant,
    LatestCompilerVersion,
    LiteralKind,
    Mutability,
    StateVariableVisibility,
    Value
} from "../../../src";

const cases: Array<[string, (factory: ASTNodeFactory) => Expression, boolean, Value | undefined]> =
    [
        [
            "PrimaryExpression (invalid expression)",
            (factory: ASTNodeFactory) => factory.makePrimaryExpression("???"),
            false,
            undefined
        ],
        [
            "Literal (unknown)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", "unknown" as LiteralKind, "", "???"),
            true,
            undefined
        ],
        [
            "Literal (true)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
            true,
            true
        ],
        [
            "Literal (false)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false"),
            true,
            false
        ],
        [
            "Literal (string)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.String, "", "abc"),
            true,
            "abc"
        ],
        [
            "Literal (unicode string)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.UnicodeString, "", "Some 😎 string"),
            true,
            "Some 😎 string"
        ],
        [
            "Literal (hex string)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.HexString, "ffcc33", "abcdef"),
            true,
            BigInt("0xffcc33")
        ],
        [
            "Literal (uint8)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "256"),
            true,
            256n
        ],
        [
            "Literal (uint16, underscore separator)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "0xff_ff"),
            true,
            BigInt("0xffff")
        ],
        [
            "Literal (uint with subdenomintation)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "2", EtherUnit.Ether),
            true,
            2_000_000_000_000_000_000n
        ],
        [
            "Literal (decimal)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "2.5"),
            true,
            new Decimal(2.5)
        ],
        [
            "Literal (decimal with subdenomintation)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "2.5", EtherUnit.Ether),
            true,
            2_500_000_000_000_000_000n
        ],
        [
            "Literal (uint with invalid subdenomintation)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral(
                    "<missing>",
                    LiteralKind.Number,
                    "",
                    "1",
                    "unknown" as EtherUnit
                ),
            true,
            undefined
        ],
        [
            "UnaryOperation (!true)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "!",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            false
        ],
        [
            "UnaryOperation (!false)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "!",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            true
        ],
        [
            "UnaryOperation (!0)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "!",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0")
                ),
            true,
            undefined
        ],
        [
            "UnaryOperation (~0)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "~",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0")
                ),
            true,
            -1n
        ],
        [
            "UnaryOperation (~false)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "~",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            undefined
        ],
        [
            "UnaryOperation (-1)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "-",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            -1n
        ],
        [
            "UnaryOperation (-0.5)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "-",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5")
                ),
            true,
            new Decimal(-0.5)
        ],
        [
            "UnaryOperation (-true)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "-",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            undefined
        ],
        [
            "UnaryOperation (+1)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "+",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            1n
        ],
        [
            "UnaryOperation (+0.5)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "+",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5")
                ),
            true,
            new Decimal(0.5)
        ],
        [
            "UnaryOperation (+true)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "+",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            undefined
        ],
        [
            "UnaryOperation (???true)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "???",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            undefined
        ],
        [
            "BinaryOperation (true && false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "&&",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (true || false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "||",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 || 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "||",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            undefined
        ],
        [
            "BinaryOperation (string == string)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.String, "", "abc"),
                    factory.makeLiteral("<missing>", LiteralKind.String, "", "def")
                ),
            true,
            undefined
        ],
        [
            "BinaryOperation (1 == 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (true == true)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (false == false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (true == false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (1 == 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (1 != 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (2 != 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (0.5 != 0.5)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (true != true)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (false != false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (true != false)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "!=",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes1(0x00) == '')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes1",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes1)", "bytes1"),
                        [factory.makeLiteral("int_const 0", LiteralKind.Number, "30783030", "0x00")]
                    ),
                    factory.makeLiteral('literal_string ""', LiteralKind.String, "", "")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes1(0x00) == hex'')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes1",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes1)", "bytes1"),
                        [factory.makeLiteral("int_const 0", LiteralKind.Number, "30783030", "0x00")]
                    ),
                    factory.makeLiteral('literal_string ""', LiteralKind.HexString, "", "")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes1(0x58) == 'X')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes1",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes1)", "bytes1"),
                        [
                            factory.makeLiteral(
                                "int_const 88",
                                LiteralKind.Number,
                                "30783538",
                                "0x58"
                            )
                        ]
                    ),
                    factory.makeLiteral('literal_string "X"', LiteralKind.String, "58", "X")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes1(0x58) == hex'58')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes1",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes1)", "bytes1"),
                        [
                            factory.makeLiteral(
                                "int_const 88",
                                LiteralKind.Number,
                                "30783538",
                                "0x58"
                            )
                        ]
                    ),
                    factory.makeLiteral('literal_string "X"', LiteralKind.HexString, "58", "X")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes2(0x5859) == 'XY')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes2",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes2)", "bytes2"),
                        [
                            factory.makeLiteral(
                                "int_const 22617",
                                LiteralKind.Number,
                                "307835383539",
                                "0x5859"
                            )
                        ]
                    ),
                    factory.makeLiteral('literal_string "XY"', LiteralKind.String, "5859", "XY")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (bytes2(0x5859) == hex'5859')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "==",
                    factory.makeFunctionCall(
                        "bytes2",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(bytes2)", "bytes2"),
                        [
                            factory.makeLiteral(
                                "int_const 22617",
                                LiteralKind.Number,
                                "307835383539",
                                "0x5859"
                            )
                        ]
                    ),
                    factory.makeLiteral('literal_string "XY"', LiteralKind.HexString, "5859", "XY")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 < 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 < 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (1 <= 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 <= 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (2 <= 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (2 > 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 > 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            false
        ],
        [
            "BinaryOperation (2 >= 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 >= 1)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                ),
            true,
            true
        ],
        [
            "BinaryOperation (1 >= 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">=",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            false
        ],
        [
            "BinaryOperation ('Y' >= 'X')",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">=",
                    factory.makeLiteral('literal_string "Y"', LiteralKind.String, "59", "Y"),
                    factory.makeLiteral('literal_string "X"', LiteralKind.String, "58", "X")
                ),
            true,
            undefined
        ],
        [
            "BinaryOperation (1 + 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "+",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            3n
        ],
        [
            "BinaryOperation (1 - 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "-",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            -1n
        ],
        [
            "BinaryOperation (2 * 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "*",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            4n
        ],
        [
            "BinaryOperation (4 / 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "/",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "4"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            2n
        ],
        /**
         * @todo Need to double-check and fix
         */
        // [
        //     "BinaryOperation (1 / 2)",
        //     (factory: ASTNodeFactory) =>
        //         factory.makeBinaryOperation(
        //             "<missing>",
        //             "/",
        //             factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
        //             factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
        //         ),
        //     true,
        //     "0n"
        // ],
        [
            "BinaryOperation (3 % 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "%",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "3"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            1n
        ],
        [
            "BinaryOperation (4 % 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "%",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "4"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            0n
        ],
        [
            "BinaryOperation (2 ** 8)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "**",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "8")
                ),
            true,
            256n
        ],
        [
            "BinaryOperation (2 ** 256)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "**",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "256")
                ),
            true,
            115792089237316195423570985008687907853269984665640564039457584007913129639936n
        ],
        [
            "BinaryOperation (2 << 5)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<<",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "5")
                ),
            true,
            64n
        ],
        [
            "BinaryOperation (2 << 100)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "<<",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "100")
                ),
            true,
            2535301200456458802993406410752n
        ],
        [
            "BinaryOperation (126 >> 3)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">>",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "126"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "3")
                ),
            true,
            15n
        ],
        [
            "BinaryOperation (2535301200456458802993406410752 >> 100)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    ">>",
                    factory.makeLiteral(
                        "<missing>",
                        LiteralKind.Number,
                        "",
                        "2535301200456458802993406410752"
                    ),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "100")
                ),
            true,
            2n
        ],
        [
            "BinaryOperation (11 | 116)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "|",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "11"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "116")
                ),
            true,
            127n
        ],
        [
            "BinaryOperation (-11 | -116)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "|",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-11"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-116")
                ),
            true,
            -3n
        ],
        [
            "BinaryOperation (10 & 3)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "&",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "3")
                ),
            true,
            2n
        ],
        [
            "BinaryOperation (-10 & -3)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "&",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-10"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-3")
                ),
            true,
            -12n
        ],
        [
            "BinaryOperation (8 ^ 10)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "^",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "8"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10")
                ),
            true,
            2n
        ],
        [
            "BinaryOperation (-8 ^ -10)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "^",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-8"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "-10")
                ),
            true,
            14n
        ],
        [
            "BinaryOperation (0.5 ^ 0.5)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "^",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "0.5")
                ),
            true,
            undefined
        ],
        [
            "BinaryOperation (1 ??? 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "???",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            undefined
        ],
        [
            "TupleExpression (empty)",
            (factory: ASTNodeFactory) => factory.makeTupleExpression("<missing>", false, []),
            false,
            undefined
        ],
        [
            "TupleExpression ([10])",
            (factory: ASTNodeFactory) =>
                factory.makeTupleExpression("<missing>", true, [
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10")
                ]),
            false,
            undefined
        ],
        [
            "TupleExpression ((10, 20))",
            (factory: ASTNodeFactory) =>
                factory.makeTupleExpression("<missing>", false, [
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "20")
                ]),
            false,
            undefined
        ],
        [
            "TupleExpression ((null))",
            (factory: ASTNodeFactory) => factory.makeTupleExpression("<missing>", false, [null]),
            false,
            undefined
        ],
        [
            "TupleExpression ((10))",
            (factory: ASTNodeFactory) =>
                factory.makeTupleExpression("<missing>", false, [
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10")
                ]),
            true,
            10n
        ],
        [
            "Conditional (true ? 10 : 1000)",
            (factory: ASTNodeFactory) =>
                factory.makeConditional(
                    "<missing>",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "true"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1000")
                ),
            true,
            10n
        ],
        [
            "Conditional (false ? 10 : 1000)",
            (factory: ASTNodeFactory) =>
                factory.makeConditional(
                    "<missing>",
                    factory.makeLiteral("<missing>", LiteralKind.Bool, "", "false"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "10"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1000")
                ),
            true,
            1000n
        ],
        [
            "Identifier & VariableDeclaration (A + 1, const A = 2)",
            (factory: ASTNodeFactory) => {
                const v = factory.makeVariableDeclaration(
                    true,
                    false,
                    "A",
                    0,
                    true,
                    DataLocation.Default,
                    StateVariableVisibility.Public,
                    Mutability.Constant,
                    "uint8",
                    undefined,
                    factory.makeElementaryTypeName("uint8", "uint8"),
                    undefined,
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                );

                return factory.makeBinaryOperation(
                    "uint8",
                    "+",
                    factory.makeIdentifierFor(v),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                );
            },
            true,
            3n
        ],
        [
            "Identifier & VariableDeclaration (A + 1, mutable A)",
            (factory: ASTNodeFactory) => {
                const v = factory.makeVariableDeclaration(
                    false,
                    false,
                    "A",
                    0,
                    true,
                    DataLocation.Default,
                    StateVariableVisibility.Public,
                    Mutability.Mutable,
                    "uint8",
                    undefined,
                    factory.makeElementaryTypeName("uint8", "uint8"),
                    undefined
                );

                return factory.makeBinaryOperation(
                    "uint8",
                    "+",
                    factory.makeIdentifierFor(v),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1")
                );
            },
            false,
            undefined
        ],
        [
            "Identifier & StructDefinition (invalid)",
            (factory: ASTNodeFactory) =>
                factory.makeIdentifierFor(
                    factory.makeStructDefinition("SomeStruct", 0, "internal", [])
                ),
            false,
            undefined
        ],
        [
            "FunctionCall (typeConversion)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "uint256",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint256", "uint256"),
                    [factory.makeLiteral("uint8", LiteralKind.Number, "", "1")]
                ),
            true,
            1n
        ],
        [
            "FunctionCall (typeConversion, mutable variable)",
            (factory: ASTNodeFactory) => {
                return factory.makeFunctionCall(
                    "uint256",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint256", "uint256"),
                    [
                        factory.makeVariableDeclaration(
                            false,
                            false,
                            "A",
                            0,
                            true,
                            DataLocation.Default,
                            StateVariableVisibility.Public,
                            Mutability.Mutable,
                            "uint8",
                            undefined,
                            factory.makeElementaryTypeName("uint8", "uint8"),
                            undefined
                        )
                    ]
                );
            },
            false,
            undefined
        ],
        [
            "FunctionCall (unsigned typeConversion 1)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "uint8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "uint8"),
                    [factory.makeLiteral("uint16", LiteralKind.Number, "", "255")]
                ),
            true,
            255n
        ],
        [
            "FunctionCall (unsigned typeConversion 2)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "uint8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "uint8"),
                    [factory.makeLiteral("uint16", LiteralKind.Number, "", "256")]
                ),
            true,
            0n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 1)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("uint16", LiteralKind.Number, "", "128")]
                ),
            true,
            -128n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 2)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("uint16", LiteralKind.Number, "", "127")]
                ),
            true,
            127n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 1)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("int16", LiteralKind.Number, "", "-128")]
                ),
            true,
            -128n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 2)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("int16", LiteralKind.Number, "", "-129")]
                ),
            true,
            127n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 3)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("int16", LiteralKind.Number, "", "-256")]
                ),
            true,
            0n
        ],
        [
            "FunctionCall (unsigned->signed typeConversion 3)",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "int8",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("uint8", "int8"),
                    [factory.makeLiteral("int16", LiteralKind.Number, "", "-255")]
                ),
            true,
            1n
        ],
        [
            "Edge-case: uint256(~uint8(1))",
            (factory: ASTNodeFactory) =>
                factory.makeFunctionCall(
                    "uint256",
                    FunctionCallKind.TypeConversion,
                    factory.makeElementaryTypeNameExpression("type(uint256)", "uint256"),
                    [
                        factory.makeUnaryOperation(
                            "uint8",
                            true,
                            "~",
                            factory.makeFunctionCall(
                                "uint8",
                                FunctionCallKind.TypeConversion,
                                factory.makeElementaryTypeNameExpression("type(uint8)", "uint8"),
                                [factory.makeLiteral("int_const 1", LiteralKind.Number, "31", "1")]
                            )
                        )
                    ]
                ),
            true,
            254n
        ],
        [
            "Edge-case <0.8.0: -uint8(1)",
            (factory: ASTNodeFactory) =>
                factory.makeUnaryOperation(
                    "<missing>",
                    true,
                    "-",
                    factory.makeFunctionCall(
                        "uint8",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(uint8)", "uint8"),
                        [factory.makeLiteral("int_const 1", LiteralKind.Number, "31", "1")]
                    )
                ),
            true,
            255n
        ],
        [
            "Edge-case <0.8.0: uint8(255) + 1",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "+",
                    factory.makeFunctionCall(
                        "uint8",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(uint8)", "uint8"),
                        [factory.makeLiteral("int_const 255", LiteralKind.Number, "", "255")]
                    ),
                    factory.makeLiteral("int_const 1", LiteralKind.Number, "31", "1")
                ),
            true,
            0n
        ],
        [
            "Edge-case <0.8.0: 1 + uint8(255)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "+",
                    factory.makeLiteral("int_const 1", LiteralKind.Number, "31", "1"),
                    factory.makeFunctionCall(
                        "uint8",
                        FunctionCallKind.TypeConversion,
                        factory.makeElementaryTypeNameExpression("type(uint8)", "uint8"),
                        [factory.makeLiteral("int_const 255", LiteralKind.Number, "", "255")]
                    )
                ),
            true,
            0n
        ]
    ];

describe("Constant expression evaluator unit test (isConstant() + evalConstantExpr())", () => {
    let factory: ASTNodeFactory;
    let inference: InferType;

    before(() => {
        factory = new ASTNodeFactory();
        inference = new InferType(LatestCompilerVersion);
    });

    for (const [name, exprBuilder, isConst, value] of cases) {
        it(`${name} ${value === undefined ? "throws" : "-> " + value.toString()}`, () => {
            const expr = exprBuilder(factory);

            expect(isConstant(expr)).toEqual(isConst);

            if (value === undefined) {
                expect(() => evalConstantExpr(expr, inference)).toThrow();
            } else {
                expect(evalConstantExpr(expr, inference)).toEqual(value);
            }
        });
    }
});
