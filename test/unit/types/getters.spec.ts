import expect from "expect";
import {
    AddressType,
    ArrayType,
    ASTReader,
    compileSol,
    DataLocation,
    detectCompileErrors,
    eq,
    FixedBytesType,
    FunctionStateMutability,
    FunctionType,
    FunctionVisibility,
    getterTypeForVar,
    IntType,
    PointerType,
    SourceUnit,
    StringType,
    TupleType,
    TypeNode,
    VariableDeclaration
} from "../../../src";

const cases: Array<[string, Array<[string, TypeNode]>]> = [
    [
        "test/samples/solidity/getters.sol",
        [
            [
                "a",
                new FunctionType(
                    "a",
                    [new IntType(256, false)],
                    [new IntType(256, false)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "b",
                new FunctionType(
                    "b",
                    [new AddressType(false)],
                    [new IntType(256, false)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "c",
                new FunctionType(
                    "c",
                    [],
                    [new IntType(8, false)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "d",
                new FunctionType(
                    "d",
                    [],
                    [new IntType(8, false), new FixedBytesType(1)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "e",
                new FunctionType(
                    "e",
                    [],
                    [new AddressType(false)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "f",
                new FunctionType(
                    "f",
                    [new IntType(256, false)],
                    [
                        new IntType(8, true),
                        new PointerType(new StringType(), DataLocation.Memory),
                        new TupleType([
                            new IntType(8, false),
                            new PointerType(
                                new ArrayType(new IntType(256, false)),
                                DataLocation.Memory
                            ),
                            new FixedBytesType(1)
                        ])
                    ],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ],
            [
                "g",
                new FunctionType(
                    "g",
                    [new IntType(256, false)],
                    [new AddressType(false)],
                    FunctionVisibility.Public,
                    FunctionStateMutability.View
                )
            ]
        ]
    ]
];

describe("getterTypeForVar() and getterArgsAndReturn()", () => {
    for (const [sample, mapping] of cases) {
        describe(sample, () => {
            let unit: SourceUnit;

            before(() => {
                const { data } = compileSol(sample, "auto", []);
                const errors = detectCompileErrors(data);

                expect(errors).toHaveLength(0);

                const reader = new ASTReader();
                const units = reader.read(data);

                expect(units.length).toEqual(1);

                unit = units[0];
            });

            for (const [varName, expectedType] of mapping) {
                it(`${varName} -> ${expectedType.pp()}`, () => {
                    const vars: VariableDeclaration[] = unit.getChildrenBySelector(
                        (node) =>
                            node instanceof VariableDeclaration &&
                            node.stateVariable &&
                            node.name === varName
                    );

                    expect(vars.length).toEqual(1);

                    const resultType = getterTypeForVar(vars[0]);

                    if (!eq(resultType, expectedType)) {
                        throw new Error(`Expected ${expectedType.pp()}, got ${resultType.pp()}`);
                    }
                });
            }
        });
    }
});
