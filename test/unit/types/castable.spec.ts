import { expect } from "expect";
import {
    AddressType,
    ArrayType,
    ASTNodeFactory,
    BytesType,
    castable,
    CompilerVersions04,
    CompilerVersions05,
    ContractDefinition,
    ContractKind,
    DataLocation,
    FixedBytesType,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    IntLiteralType,
    IntType,
    LatestCompilerVersion,
    PointerType,
    StringLiteralType,
    TypeNode,
    UserDefinedType
} from "../../../src";

const cases: Array<
    [
        TypeNode | ((factory: ASTNodeFactory) => TypeNode),
        TypeNode | ((factory: ASTNodeFactory) => TypeNode),
        string,
        boolean
    ]
> = [
    [
        new PointerType(new ArrayType(new IntType(8, false)), DataLocation.Memory),
        new PointerType(new ArrayType(new IntType(8, false)), DataLocation.CallData),
        LatestCompilerVersion,
        true
    ],
    [
        new PointerType(new ArrayType(new IntType(8, false)), DataLocation.Memory),
        new PointerType(new ArrayType(new IntType(8, true)), DataLocation.CallData),
        LatestCompilerVersion,
        false
    ],
    [new StringLiteralType("string"), new FixedBytesType(32), LatestCompilerVersion, true],
    [new StringLiteralType("hexString"), new FixedBytesType(32), LatestCompilerVersion, true],
    [
        new StringLiteralType("string"),
        new PointerType(new BytesType(), DataLocation.Memory),
        LatestCompilerVersion,
        true
    ],
    [
        new StringLiteralType("hexString"),
        new PointerType(new BytesType(), DataLocation.CallData),
        LatestCompilerVersion,
        true
    ],
    [new IntLiteralType(0xffn), new FixedBytesType(1), LatestCompilerVersion, true],
    [new IntLiteralType(-1n), new FixedBytesType(1), LatestCompilerVersion, false],
    [new IntLiteralType(0xffffn), new IntType(16, false), LatestCompilerVersion, true],
    [new IntLiteralType(0n), new AddressType(false), CompilerVersions05[0], false],
    [
        new IntLiteralType(0n),
        new AddressType(false),
        CompilerVersions04[CompilerVersions04.length - 1],
        true
    ],
    [new AddressType(true), new AddressType(false), LatestCompilerVersion, true],
    [new AddressType(false), new AddressType(true), LatestCompilerVersion, false],
    [new FixedBytesType(12), new FixedBytesType(24), LatestCompilerVersion, true],
    [new FixedBytesType(24), new FixedBytesType(12), LatestCompilerVersion, false],
    [new IntType(8, true), new IntType(16, true), LatestCompilerVersion, true],
    [new IntType(8, false), new IntType(16, false), LatestCompilerVersion, true],
    [new IntType(16, true), new IntType(8, true), LatestCompilerVersion, false],
    [new IntType(16, false), new IntType(8, false), LatestCompilerVersion, false],
    [new IntType(8, false), new AddressType(false), LatestCompilerVersion, true],
    [new IntType(160, false), new AddressType(false), LatestCompilerVersion, true],
    [new IntType(256, false), new AddressType(false), LatestCompilerVersion, false],
    [new IntType(8, true), new AddressType(false), LatestCompilerVersion, false],
    [
        (factory) => {
            const c = factory.makeContractDefinition(
                "ContractWithoutCallbacks",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                []
            );

            c.linearizedBaseContracts.push(c.id);

            return new UserDefinedType(c.name, c);
        },
        new AddressType(false),
        LatestCompilerVersion,
        true
    ],
    [
        (factory) => {
            const c = factory.makeContractDefinition(
                "ContractWithoutCallbacks",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                []
            );

            c.linearizedBaseContracts.push(c.id);

            return new UserDefinedType(c.name, c);
        },
        new AddressType(true),
        LatestCompilerVersion,
        false
    ],
    [
        (factory) => {
            const c = factory.makeContractDefinition(
                "ContractWithCallbackFn",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                [],
                undefined,
                [
                    factory.makeFunctionDefinition(
                        0,
                        FunctionKind.Fallback,
                        "",
                        false,
                        FunctionVisibility.External,
                        FunctionStateMutability.Payable,
                        false,
                        factory.makeParameterList([]),
                        factory.makeParameterList([]),
                        []
                    )
                ]
            );

            c.linearizedBaseContracts.push(c.id);

            return new UserDefinedType(c.name, c);
        },
        new AddressType(true),
        LatestCompilerVersion,
        true
    ],
    [
        (factory) => {
            const c = factory.makeContractDefinition(
                "ContractWithReceiveFn",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                [],
                undefined,
                [
                    factory.makeFunctionDefinition(
                        0,
                        FunctionKind.Receive,
                        "",
                        false,
                        FunctionVisibility.External,
                        FunctionStateMutability.Payable,
                        false,
                        factory.makeParameterList([]),
                        factory.makeParameterList([]),
                        []
                    )
                ]
            );

            c.linearizedBaseContracts.push(c.id);

            return new UserDefinedType(c.name, c);
        },
        new AddressType(true),
        LatestCompilerVersion,
        true
    ],
    [
        (factory) => {
            const a = factory.makeContractDefinition(
                "A",
                0,
                ContractKind.Contract,
                false,
                true,
                [factory.context.lastId],
                []
            );

            a.linearizedBaseContracts.unshift(a.id);

            return new UserDefinedType(a.name, a);
        },
        (factory) => {
            const a = factory.context.require(factory.context.lastId) as ContractDefinition;
            const b = factory.makeContractDefinition(
                "B",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                []
            );

            // Patch contract A to inherit from B
            a.linearizedBaseContracts.push(b.id);

            return new UserDefinedType(b.name, b);
        },
        LatestCompilerVersion,
        true
    ],
    [
        (factory) => {
            const a = factory.makeContractDefinition(
                "A",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                []
            );

            a.linearizedBaseContracts.unshift(a.id);

            return new UserDefinedType(a.name, a);
        },
        (factory) => {
            const b = factory.makeContractDefinition(
                "B",
                0,
                ContractKind.Contract,
                false,
                true,
                [],
                []
            );

            return new UserDefinedType(b.name, b);
        },
        LatestCompilerVersion,
        false
    ]
];

describe("Type casting unit test (castable())", () => {
    const factory = new ASTNodeFactory();

    for (const [from, to, compilerVersion, expectation] of cases) {
        const fromT = from instanceof TypeNode ? from : from(factory);
        const toT = to instanceof TypeNode ? to : to(factory);

        it(`${fromT.pp()} -> ${toT.pp()}" expected to be ${expectation} (in ${compilerVersion})`, () => {
            expect(castable(fromT, toT, compilerVersion)).toEqual(expectation);
        });
    }
});
