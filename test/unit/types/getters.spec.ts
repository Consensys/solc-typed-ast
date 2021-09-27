import expect from "expect";
import {
    ABIEncoderVersion,
    AddressType,
    assert,
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
    StructDefinition,
    TypeNode,
    UserDefinedType,
    VariableDeclaration
} from "../../../src";

type DeferredTypeNode = (unit: SourceUnit) => TypeNode;

function getStateVar(unit: SourceUnit, name: string): VariableDeclaration {
    const vars: VariableDeclaration[] = unit.getChildrenBySelector(
        (node) => node instanceof VariableDeclaration && node.stateVariable && node.name === name
    );

    assert(vars.length === 1, `Unable to get state variable with name "${name}"`);

    return vars[0];
}

function getStruct(unit: SourceUnit, canonicalName: string): StructDefinition {
    const defs = unit.getChildrenBySelector<StructDefinition>(
        (node) => node instanceof StructDefinition && node.canonicalName === canonicalName
    );

    assert(defs.length === 1, `Unable get structured definition with name "${canonicalName}"`);

    return defs[0];
}

const cases: Array<[string, Array<[string, TypeNode | DeferredTypeNode]>]> = [
    [
        "test/samples/solidity/getters_08.sol",
        [
            [
                "a",
                new FunctionType(
                    "a",
                    [new IntType(256, false)],
                    [new IntType(256, false)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ],
            [
                "b",
                new FunctionType(
                    "b",
                    [new AddressType(false)],
                    [new IntType(256, false)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ],
            [
                "c",
                new FunctionType(
                    "c",
                    [],
                    [new IntType(8, false)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ],
            [
                "d",
                new FunctionType(
                    "d",
                    [],
                    [new IntType(8, false), new FixedBytesType(1)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ],
            [
                "e",
                new FunctionType(
                    "e",
                    [],
                    [new AddressType(false)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ],
            [
                "f",
                (unit: SourceUnit) => {
                    const def = getStruct(unit, "AccessorReturns.S1");

                    return new FunctionType(
                        "f",
                        [new IntType(256, false)],
                        [
                            new IntType(8, true),
                            new PointerType(new StringType(), DataLocation.Memory),
                            new PointerType(
                                new UserDefinedType(def.canonicalName, def),
                                DataLocation.Memory
                            )
                        ],
                        FunctionVisibility.External,
                        FunctionStateMutability.View
                    );
                }
            ],
            [
                "g",
                new FunctionType(
                    "g",
                    [new IntType(256, false)],
                    [new AddressType(false)],
                    FunctionVisibility.External,
                    FunctionStateMutability.View
                )
            ]
        ]
    ],
    [
        "test/samples/solidity/getters_07.sol",
        [
            [
                "s",
                (unit: SourceUnit) => {
                    const def = getStruct(unit, "AccessorReturns.S2");

                    return new FunctionType(
                        "s",
                        [],
                        [
                            new PointerType(
                                new UserDefinedType(def.canonicalName, def),
                                DataLocation.Memory
                            ),
                            new IntType(256, false)
                        ],
                        FunctionVisibility.External,
                        FunctionStateMutability.View
                    );
                }
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

            for (const [stateVarName, typing] of mapping) {
                it(`${stateVarName} -> ${
                    typing instanceof TypeNode ? typing.pp() : "(deferred)"
                }`, () => {
                    const expectedType = typing instanceof TypeNode ? typing : typing(unit);
                    const stateVar = getStateVar(unit, stateVarName);
                    const resultType = getterTypeForVar(stateVar, ABIEncoderVersion.V2);

                    assert(
                        eq(resultType, expectedType),
                        "Expected {0}, got {1}",
                        expectedType,
                        resultType
                    );
                });
            }
        });
    }
});
