import { expect } from "expect";
import {
    ABIEncoderVersion,
    ASTNodeFactory,
    ArrayType,
    BuiltinFunctionType,
    ContractKind,
    DataLocation,
    ErrorType,
    EventType,
    FunctionLikeSetType,
    FunctionStateMutability,
    FunctionType,
    FunctionVisibility,
    ImportRefType,
    InferType,
    IntLiteralType,
    IntType,
    LatestCompilerVersion,
    MappingType,
    Mutability,
    PointerType,
    RationalLiteralType,
    StateVariableVisibility,
    StringLiteralType,
    SuperType,
    TRest,
    TVar,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType,
    types
} from "../../../src";

const cases: Array<
    [
        TypeNode | ((factory: ASTNodeFactory, inference: InferType) => TypeNode),
        string,
        ABIEncoderVersion,
        boolean
    ]
> = [
    [new StringLiteralType("string"), LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [new IntLiteralType(1n), LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [
        new RationalLiteralType({ numerator: 1n, denominator: 2n }),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [types.stringMemory, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.bytesMemory, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.bytesCalldata, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.bytes32, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.address, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.addressPayable, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [types.uint256, LatestCompilerVersion, ABIEncoderVersion.V1, true],
    [
        new MappingType(new IntType(8, false), new IntType(8, false)),
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [new TupleType([]), LatestCompilerVersion, ABIEncoderVersion.V1, false],
    [
        new FunctionType(
            undefined,
            [],
            [],
            FunctionVisibility.Private,
            FunctionStateMutability.Pure
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [
        new FunctionType(
            undefined,
            [],
            [],
            FunctionVisibility.Internal,
            FunctionStateMutability.Pure
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [
        new FunctionType(
            undefined,
            [],
            [],
            FunctionVisibility.Default,
            FunctionStateMutability.Pure
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [
        new FunctionType(
            undefined,
            [],
            [],
            FunctionVisibility.External,
            FunctionStateMutability.Pure
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        true
    ],
    [
        new FunctionType(
            undefined,
            [],
            [],
            FunctionVisibility.Public,
            FunctionStateMutability.Pure
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        true
    ],
    [
        (factory) => {
            const def = factory.makeContractDefinition(
                "SomeContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                [],
                []
            );

            def.linearizedBaseContracts.push(def.id);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        true
    ],
    [
        (factory) => {
            const def = factory.makeStructDefinition("SomeStruct", 0, "internal", []);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [
        (factory) => {
            const def = factory.makeStructDefinition("SomeStruct", 0, "internal", []);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        true
    ],
    [
        (factory) => {
            const def = factory.makeStructDefinition("SomeStruct", 0, "internal", [
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "someVar",
                    0,
                    false,
                    DataLocation.Storage,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "<missing>",
                    "",
                    factory.makeMapping(
                        "<missing>",
                        factory.makeElementaryTypeName("uint8", "uint8"),
                        factory.makeElementaryTypeName("uint8", "uint8")
                    )
                )
            ]);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [
        (factory) => {
            const def = factory.makeStructDefinition("SomeStruct", 0, "internal", [
                factory.makeVariableDeclaration(
                    false,
                    false,
                    "someVar",
                    0,
                    false,
                    DataLocation.Storage,
                    StateVariableVisibility.Default,
                    Mutability.Mutable,
                    "<missing>",
                    "",
                    factory.makeFunctionTypeName(
                        "<missing>",
                        FunctionVisibility.Internal,
                        FunctionStateMutability.View,
                        factory.makeParameterList([]),
                        factory.makeParameterList([])
                    )
                )
            ]);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [
        (factory) => {
            const def = factory.makeEnumDefinition("SomeEnum", []);

            return new UserDefinedType(def.name, def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        true
    ],
    [
        new PointerType(
            new ArrayType(
                new PointerType(new ArrayType(new IntType(8, false)), DataLocation.Memory)
            ),
            DataLocation.Memory
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        false
    ],
    [
        new PointerType(
            new ArrayType(
                new PointerType(new ArrayType(new IntType(8, false)), DataLocation.Memory)
            ),
            DataLocation.Memory
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        true
    ],
    [
        new PointerType(
            new ArrayType(
                new PointerType(new ArrayType(new IntType(8, false), 3n), DataLocation.Memory),
                1n
            ),
            DataLocation.Memory
        ),
        LatestCompilerVersion,
        ABIEncoderVersion.V1,
        true
    ],
    [
        new EventType("SomeEvent", [new IntType(8, false)]),
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [
        new ErrorType("SomeError", [new IntType(8, false)]),
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [new TypeNameType(new IntType(8, false)), LatestCompilerVersion, ABIEncoderVersion.V2, false],
    [
        new BuiltinFunctionType("keccak256", [types.bytesMemory], [types.bytes32]),
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [
        (factory) => {
            const def = factory.makeContractDefinition(
                "SomeContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                [],
                []
            );

            def.linearizedBaseContracts.push(def.id);

            return new SuperType(def);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ],
    [new TVar("T"), LatestCompilerVersion, ABIEncoderVersion.V2, false],
    [new TRest("..."), LatestCompilerVersion, ABIEncoderVersion.V2, false],
    [new FunctionLikeSetType([]), LatestCompilerVersion, ABIEncoderVersion.V2, false],
    [
        (factory) => {
            const unit = factory.makeSourceUnit("some.sol", 0, "path/to/some.sol", new Map());
            const imp = factory.makeImportDirective(
                "some.sol",
                "path/to/some.sol",
                "some",
                [],
                0,
                unit.id
            );

            return new ImportRefType(imp);
        },
        LatestCompilerVersion,
        ABIEncoderVersion.V2,
        false
    ]
];

describe("ABI encodability detection unit test (isABIEncodable())", () => {
    const factory = new ASTNodeFactory();

    for (const [original, compilerVersion, encoderVersion, expectation] of cases) {
        const inference = new InferType(compilerVersion);
        const originalT = original instanceof TypeNode ? original : original(factory, inference);

        it(`${originalT.pp()} -> ${expectation} (compiler ${compilerVersion}, encoder ${encoderVersion})`, () => {
            expect(inference.isABIEncodable(originalT, encoderVersion)).toEqual(expectation);
        });
    }
});
