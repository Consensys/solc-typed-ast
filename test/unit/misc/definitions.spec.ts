import expect from "expect";
import {
    ASTKind,
    ASTNode,
    ASTReader,
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08,
    compileSol,
    compileSourceString,
    ContractDefinition,
    detectCompileErrors,
    EnumDefinition,
    EventDefinition,
    ExternalReferenceType,
    forAll,
    FunctionCall,
    FunctionDefinition,
    Identifier,
    IdentifierPath,
    InferType,
    resolveAny,
    SourceUnit,
    StateVariableVisibility,
    StructDefinition,
    UserDefinedTypeName,
    VariableDeclaration
} from "../../../src";

const samples: Array<[string, string, ASTKind]> = [
    [
        "./test/samples/solidity/compile_04.sol",
        CompilerVersions04[CompilerVersions04.length - 1],
        ASTKind.Legacy
    ],
    [
        "./test/samples/solidity/compile_05.sol",
        CompilerVersions05[CompilerVersions05.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_06.sol",
        CompilerVersions06[CompilerVersions06.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_07.sol",
        CompilerVersions07[CompilerVersions07.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/latest_08.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/resolving_08.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/block_04.sol",
        CompilerVersions04[CompilerVersions04.length - 1],
        ASTKind.Legacy
    ],
    [
        "./test/samples/solidity/resolving/block_05.sol",
        CompilerVersions05[CompilerVersions05.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/imports_and_source_unit_function_overloading.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/inheritance_and_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/shadowing_overloading_and_overriding.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ],
    [
        "./test/samples/solidity/resolving/simple_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern
    ]
];

describe("resolveAny() correctly resolves all Identifiers/UserDefinedTypeNames/FunctionCalls", () => {
    for (const [sample, compilerVersion, astKind] of samples) {
        it(`All definitions in ${sample} resolve correctly`, async () => {
            const result = await compileSol(sample, "auto");

            expect(result.compilerVersion).toEqual(compilerVersion);

            const errors = detectCompileErrors(result.data);

            expect(errors).toHaveLength(0);

            const reader = new ASTReader();
            const sourceUnits = reader.read(result.data, astKind);

            for (const unit of sourceUnits) {
                const inference = new InferType(compilerVersion);

                for (const node of unit.getChildrenBySelector(
                    (child) =>
                        child instanceof Identifier ||
                        child instanceof IdentifierPath ||
                        child instanceof UserDefinedTypeName ||
                        child instanceof FunctionCall ||
                        child instanceof StructDefinition ||
                        child instanceof EnumDefinition
                )) {
                    const namedNode = node as
                        | Identifier
                        | UserDefinedTypeName
                        | FunctionCall
                        | IdentifierPath
                        | StructDefinition
                        | EnumDefinition;

                    let def: ASTNode | undefined;

                    if (
                        namedNode instanceof Identifier ||
                        namedNode instanceof UserDefinedTypeName ||
                        namedNode instanceof IdentifierPath ||
                        namedNode instanceof FunctionCall
                    ) {
                        def = namedNode.vReferencedDeclaration;
                    } else {
                        def = namedNode;
                    }

                    let name: string;
                    let ctx: ASTNode;

                    if (namedNode instanceof FunctionCall) {
                        if (
                            namedNode.vFunctionCallType !== ExternalReferenceType.UserDefined ||
                            namedNode.vFunctionName === "" ||
                            namedNode.vReferencedDeclaration === undefined
                        ) {
                            continue;
                        }

                        name = namedNode.vFunctionName;

                        ctx =
                            namedNode.vReferencedDeclaration.vScope instanceof ContractDefinition
                                ? namedNode.vReferencedDeclaration
                                : namedNode;
                    } else if (
                        namedNode instanceof StructDefinition ||
                        namedNode instanceof EnumDefinition
                    ) {
                        name = namedNode.canonicalName;
                        ctx = namedNode;
                    } else {
                        if (namedNode.name === undefined) {
                            continue;
                        }

                        name = namedNode.name;
                        ctx = namedNode;
                    }

                    if (def === undefined || name === undefined) {
                        continue;
                    }

                    const expectedID = def.id;
                    const resolved = [...resolveAny(name, ctx, inference)];

                    expect(resolved.length).toBeGreaterThanOrEqual(1);

                    if (resolved.length > 1) {
                        const areEvents = resolved[0] instanceof EventDefinition;

                        expect(
                            forAll(resolved, (def) =>
                                areEvents
                                    ? def instanceof EventDefinition
                                    : def instanceof FunctionDefinition ||
                                      (def instanceof VariableDeclaration &&
                                          def.stateVariable &&
                                          def.visibility === StateVariableVisibility.Public)
                            )
                        ).toBeTruthy();
                    }

                    const resolvedIds = new Set(resolved.map((node) => node.id));

                    expect(resolvedIds.has(expectedID)).toBeTruthy();
                }
            }
        });
    }
});

const unitSamples: Array<
    [string, string, ASTKind, Array<[number, Array<[string, number[], string]>]>]
> = [
    [
        "./test/samples/solidity/resolving/simple_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern,
        [
            [
                43, // Body of main()
                [
                    ["foo", [34], "foo is the param of main, not the contract struct"],
                    ["bar", [36], "bar is the param of main, not the contract enum"],
                    ["boo", [38], "boo is the param of main, not the contract event"],
                    ["f1", [40], "f1 is the param of main, not the contract function"],
                    ["gfoo", [28], "gfoo is the contract state var, not the global struct def"],
                    ["gbar", [30], "gbar is the contract state var, not the global enum def"],
                    ["gf1", [32], "gf1 is the contract state var, not the free function"]
                ]
            ]
        ]
    ],
    [
        "./test/samples/solidity/resolving/inheritance_and_shadowing.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern,
        [
            [
                13, // Body of main()
                [["foo", [4], "foo is inherited struct definition, not the global constant"]]
            ]
        ]
    ],
    [
        "./test/samples/solidity/resolving/block_05.sol",
        CompilerVersions05[CompilerVersions05.length - 1],
        ASTKind.Modern,
        [
            [
                8, // Variable declaration for m
                [["foo", [4], "foo in the begining of main refers to the struct"]]
            ],
            [
                11, // Variable declaration for foo
                [["foo", [4], "foo at the variable declaration for foo still refers to the struct"]]
            ],
            [
                20, // Assignment after variable declaration for foo
                [
                    [
                        "foo",
                        [11],
                        "foo after the variable declaration for foo refers to the vardeclstmt"
                    ]
                ]
            ]
        ]
    ],
    [
        "./test/samples/solidity/resolving/block_04.sol",
        CompilerVersions04[CompilerVersions04.length - 1],
        ASTKind.Legacy,
        [
            [
                12, // Variable declaration statement for m
                [
                    [
                        "bar",
                        [14],
                        "Later variable declaration statement for bar is visible in earlier statement in same block for m"
                    ]
                ]
            ],
            [
                17, // Variable declaration statement for bar
                [
                    [
                        "m",
                        [8],
                        "Variable declaration statement for m is visible in alter statement in same block for bar"
                    ]
                ]
            ]
        ]
    ],
    [
        "./test/samples/solidity/resolving/shadowing_overloading_and_overriding.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern,
        [
            [
                27, // body of the free function boo
                [
                    ["foo", [11], "foo at the global scope corresponds to the free function"],
                    ["boo", [27], "foo at the global scope corresponds to the free function"],
                    ["bar", [21], "foo at the global scope corresponds to the free function"],
                    ["v", [32], "foo at the global scope corresponds to the global struct def"]
                ]
            ],

            [
                61, // Modifier definition inside Base
                [
                    [
                        "foo",
                        [36, 42],
                        "foo in Base correspodns to the 2 overloaded function definitions"
                    ],
                    [
                        "v",
                        [47, 57],
                        "v in Base corresponds to the 2 overloaded function definitions"
                    ],
                    ["E", [63, 67], "E in Base corrseponds to the 2 overloaded event definitions"]
                ]
            ],
            [
                114, // main function definition in Child
                [
                    [
                        "foo",
                        [78, 42],
                        "foo in Child corresponds to the 1 overriden and 1 inherited overloaded function definitions"
                    ],
                    [
                        "v",
                        [73, 57],
                        "v in Child corresponds to the overriding public state var and the inherited overloaded function def"
                    ],
                    ["bar", [21], "bar in Child corresponds to the free fun"],
                    ["boo", [84], "boo in Child corresponds to the shadowing contract function"],
                    [
                        "E",
                        [63, 67],
                        "E in Child corrseponds to the 2 overloaded event definitions. (events can't be overriden)"
                    ]
                ]
            ]
        ]
    ],
    [
        "./test/samples/solidity/resolving/id_paths.sol",
        CompilerVersions08[CompilerVersions08.length - 1],
        ASTKind.Modern,
        [
            [
                68, // ContractDefinition for "Child"
                [
                    ["Base.foo", [19], "Base.foo in child is the base's version of foo"],
                    ["Child.foo", [48], "Child.foo in child is the Child's version of foo"],
                    ["Base.S", [22], "Base.S in child is the base's struct def"],
                    ["Base.E", [24], "Base.E in child is the base's enum def"],
                    ["Base.E1", [26], "Base.E1 in child is the base's event def"]
                ]
            ],
            [
                45, // "Child"'s foo's body
                [
                    ["Base.foo", [19], "Base.foo in child is the base's version of foo"],
                    ["Child.foo", [48], "Child.foo in child is the Child's version of foo"],
                    ["Base.S", [22], "Base.S in child is the base's struct def"],
                    ["Base.E", [24], "Base.E in child is the base's enum def"],
                    ["Base.E1", [26], "Base.E1 in child is the base's event def"]
                ]
            ],
            [
                131, // Unrelated's ContractDefinition
                [
                    ["Base.foo", [19], "Base.foo in child is the base's version of foo"],
                    ["Child.foo", [48], "Child.foo in child is the Child's version of foo"],
                    ["Base.S", [22], "Base.S in child is the base's struct def"],
                    ["L", [2], "L in Unrelated is the right import directive"],
                    [
                        "L.const",
                        [153],
                        "L.const in Unrelated is the imported const from the library"
                    ],

                    [
                        "L.SG",
                        [148],
                        "L.SG in Unrelated is the imported struct def from the library"
                    ],
                    ["L.EG", [150], "L.EG in Unrelated is the imported enum def from the library"],
                    [
                        "L.foo",
                        [145],
                        "L.foo in Unrelated is the imported free fun from the library"
                    ],
                    [
                        "L.Lib",
                        [166],
                        "L.Lib in Unrelated is the imported Library contract def from the library"
                    ],
                    [
                        "Lib1.foo",
                        [165],
                        "Lib1.foo in Unrelated is the function definition iniside the imported Library contract def from the library"
                    ],
                    [
                        "L.Lib.foo",
                        [165],
                        "L.Lib.foo in Unrelated is the function from the imported contract def from the library"
                    ],
                    [
                        "L.Boo",
                        [170],
                        "L.Boo in Unrelated is a contract imported inside L from another file"
                    ]
                ]
            ]
        ]
    ]
];

describe("resolveAny() unit tests", () => {
    for (const [sample, compilerVersion, astKind, sampleTests] of unitSamples) {
        describe(sample, () => {
            const reader = new ASTReader();

            beforeAll(async () => {
                const result = await compileSol(sample, "auto");

                expect(result.compilerVersion).toEqual(compilerVersion);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                reader.read(result.data, astKind);
            });

            for (const [ctxId, unitTests] of sampleTests) {
                for (const [name, expectedIds, testName] of unitTests) {
                    it(testName, () => {
                        const ctxNode = reader.context.locate(ctxId);
                        const inference = new InferType(compilerVersion);

                        const resolvedNodes = resolveAny(name, ctxNode, inference);

                        expect(new Set(expectedIds)).toEqual(
                            new Set([...resolvedNodes].map((node) => node.id))
                        );
                    });
                }
            }
        });
    }
});

describe("resolveAny() correctly handles visibility", () => {
    const compilerVersion = "0.8.13";
    const reader = new ASTReader();

    const sample = `contract Base {
    uint private privX;
    uint internal intX;
    uint public pubX;

    function privPlusOne(uint x) private pure returns (uint) {
        return x + 1;
    }

    function intPlusOne(uint x) internal pure returns (uint) {
        return x + 1;
    }

    function pubPlusOne(uint x) internal pure returns (uint) {
        return x + 1;
    }

    function extPlusOne(uint x) external pure returns (uint) {
        return x + 1;
    }
}

contract Child is Base {
     function foo(uint x) public {}
}`;
    let unit: SourceUnit;
    let foo: ASTNode;
    let inference: InferType;

    beforeAll(async () => {
        const compResult = await compileSourceString("sample.sol", sample, compilerVersion);

        [unit] = reader.read(compResult.data);

        inference = new InferType(compilerVersion);

        foo = unit.getChildrenBySelector(
            (nd) => nd instanceof FunctionDefinition && nd.name === "foo"
        )[0];
    });

    it(`Without ignoreVisiblity`, async () => {
        const tests: Array<[string, number]> = [
            ["privX", 0],
            ["intX", 1],
            ["pubX", 1],
            ["privPlusOne", 0],
            ["intPlusOne", 1],
            ["pubPlusOne", 1],
            ["extPlusOne", 1]
        ];

        for (const [name, expCount] of tests) {
            const res = resolveAny(name, foo, inference);
            expect(res.size).toEqual(expCount);
        }
    });

    it(`With ignoreVisiblity`, async () => {
        const tests: Array<[string, number]> = [
            ["privX", 1],
            ["intX", 1],
            ["pubX", 1],
            ["privPlusOne", 1],
            ["intPlusOne", 1],
            ["pubPlusOne", 1],
            ["extPlusOne", 1]
        ];

        for (const [name, expCount] of tests) {
            const res = resolveAny(name, foo, inference, false, true);
            expect(res.size).toEqual(expCount);
        }
    });
});
