import expect from "expect";
import {
    assert,
    ASTKind,
    ASTReader,
    ASTWriter,
    compileSourceString,
    DefaultASTWriterMapping,
    detectCompileErrors,
    FunctionCall,
    isFunctionCallExternal,
    PrettyFormatter
} from "../../../src";

const samples: Array<[string, string, string[]]> = [
    [
        "case_a.sol",
        `pragma solidity 0.6.0;

contract Foo {
    function a() public {}
    function b() public {}
}

contract Main {
    function c() public {}
    function d() public {}

    function main() public payable {
        Foo f =  new Foo();

        c();
        this.c();

        function () internal fIntPtr = c;

        fIntPtr();

        fIntPtr = d;

        fIntPtr();

        (true ? c : d)();

        f.a();
        f.b();

        function () external fExtPtr = f.a;

        fExtPtr();

        fExtPtr = f.b;
        fExtPtr();

        fExtPtr = this.c;
        fExtPtr();

        (true ? this.c : this.d)();
        (false ? f.a : f.b)();
    }
}
`,
        [
            "this.c",
            "f.a",
            "f.b",
            "fExtPtr",
            "fExtPtr",
            "fExtPtr",
            "(true ? this.c : this.d)",
            "(false ? f.a : f.b)"
        ]
    ]
];

describe("isFunctionCallExternal()", () => {
    for (const [sample, content, expected] of samples) {
        it(`${sample} produces ${JSON.stringify(expected)}`, async () => {
            const { data, compilerVersion } = await compileSourceString(
                "sample.sol",
                content,
                "auto"
            );

            const errors = detectCompileErrors(data);

            expect(errors).toHaveLength(0);

            const reader = new ASTReader();
            const units = reader.read(data, ASTKind.Any);

            expect(units).toHaveLength(1);

            assert(compilerVersion !== undefined, "Expected compiler version to be defined");

            const writer = new ASTWriter(
                DefaultASTWriterMapping,
                new PrettyFormatter(4, 0),
                compilerVersion
            );

            const actual = units[0]
                .getChildrenBySelector<FunctionCall>(
                    (node): node is FunctionCall =>
                        node instanceof FunctionCall && isFunctionCallExternal(node)
                )
                .map((node) => writer.write(node.vExpression));

            expect(actual).toEqual(expected);
        });
    }
});
