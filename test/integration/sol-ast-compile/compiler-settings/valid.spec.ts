import expect from "expect";
import { PossibleCompilerKinds } from "../../../../src";
import { SolAstCompileCommand, SolAstCompileExec } from "../common";

const samples: Array<[string, string[], string[]]> = [
    [
        "test/samples/solidity/missing_pragma.sol",
        [
            "--compiler-settings",
            `{"optimizer": {"enabled": true, "runs": 1}}`,
            "--compiler-version",
            "0.6.0"
        ],
        [
            "SourceUnit #5",
            'src: "0:38:0"',

            "ContractDefinition #4",
            'src: "0:37:0"',
            'name: "Test"',

            "VariableDeclaration #3",
            'src: "20:14:0"',
            'name: "some"',
            'typeString: "uint8"',

            "ElementaryTypeName #1",
            'src: "20:5:0"',
            'name: "uint8"',

            "Literal #2",
            'src: "33:1:0"',
            'value: "1"'
        ]
    ],
    [
        "test/samples/solidity/features_0824.sol",
        ["--compiler-settings", `{"evmVersion": "cancun"}`],
        [
            "SourceUnit #19",
            'src: "0:473:0"',

            "ContractDefinition #18",
            'src: "25:448:0"',
            'name: "Features_0824"',

            "MemberAccess #7",
            'src: "96:17:0"',
            'typeString: "uint256"',
            "vExpression: Identifier #6",
            'memberName: "blobbasefee"',

            "Identifier #6",
            'src: "96:5:0"',
            'typeString: "block"',
            'name: "block"',

            "Identifier #11",
            'src: "135:8:0"',
            'typeString: "function (uint256) view returns (bytes32)"',
            'name: "blobhash"',

            "InlineAssembly #15",
            'src: "157:308:0"',
            'evmVersion: "cancun"'
        ]
    ]
];

for (const [sample, customArgs, expectations] of samples) {
    describe(sample, () => {
        for (const kind of PossibleCompilerKinds) {
            const args = [sample, ...customArgs, "--compiler-kind", kind];
            const command = SolAstCompileCommand(...args);

            describe(command, () => {
                let exitCode: number | null;
                let outData: string;
                let errData: string;

                beforeAll(() => {
                    const result = SolAstCompileExec(...args);

                    outData = result.stdout;
                    errData = result.stderr;
                    exitCode = result.status;
                });

                it("Exit code is valid", () => {
                    expect(exitCode).toEqual(0);
                });

                it("STDERR is empty", () => {
                    expect(errData).toEqual("");
                });

                it("STDOUT is correct", () => {
                    for (const expectation of expectations) {
                        expect(outData).toContain(expectation);
                    }
                });
            });
        }
    });
}
