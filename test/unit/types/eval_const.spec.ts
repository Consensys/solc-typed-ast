import Decimal from "decimal.js";
import { expect } from "expect";
import {
    ASTNodeFactory,
    DataLocation,
    evalConstantExpr,
    Expression,
    isConstant,
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
            "ffcc33"
        ],
        [
            "Literal (uint8)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "256"),
            true,
            BigInt(256)
        ],
        [
            "Literal (uint16, underscore separator)",
            (factory: ASTNodeFactory) =>
                factory.makeLiteral("<missing>", LiteralKind.Number, "", "0xff_ff"),
            true,
            BigInt(65535)
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
            BigInt(-1)
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
            BigInt(-1)
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
            BigInt(1)
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
            "BinaryOperation (1 + 2)",
            (factory: ASTNodeFactory) =>
                factory.makeBinaryOperation(
                    "<missing>",
                    "+",
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "1"),
                    factory.makeLiteral("<missing>", LiteralKind.Number, "", "2")
                ),
            true,
            BigInt(3)
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
            BigInt(-1)
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
            BigInt(4)
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
            BigInt(2)
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
        //     "BigInt(0)"
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
            BigInt(1)
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
            BigInt(0)
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
            BigInt(256)
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
            BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639936")
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
            BigInt(64)
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
            BigInt("2535301200456458802993406410752")
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
            BigInt(15)
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
            BigInt(2)
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
            BigInt(127)
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
            BigInt(-3)
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
            BigInt(2)
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
            BigInt(-12)
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
            BigInt(2)
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
            BigInt(14)
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
            BigInt(10)
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
            BigInt(10)
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
            BigInt(1000)
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
            BigInt(3)
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
        ]
    ];

describe("Constant expression evaluator unit test", () => {
    let factory: ASTNodeFactory;

    before(() => {
        factory = new ASTNodeFactory();
    });

    for (const [name, exprBuilder, isConst, value] of cases) {
        it(`${name} ${value === undefined ? "throws" : "-> " + value.toString()}`, () => {
            const expr = exprBuilder(factory);

            expect(isConstant(expr)).toEqual(isConst);

            if (value === undefined) {
                expect(() => evalConstantExpr(expr)).toThrow();
            } else {
                expect(evalConstantExpr(expr)).toEqual(value);
            }
        });
    }
});
