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
    InferType,
    isFunctionCallExternal,
    PrettyFormatter
} from "../../../src";

const samples: Array<[string, string, string[]]> = [
    [
        "case_a.sol",
        `pragma solidity 0.8.0;

contract Foo {
    function a() public {}
    function b() public {}
}

library Lib {
    function w() internal {}
    function x() internal {}
    function y() public {}
    function z() external {}
}

library LibT {
    function add(uint a, uint b) pure internal returns (uint) {
        return a + b;
    }
}

contract Main {
    using LibT for uint;

    struct Some {
        function () internal intFn;
        function () external extFn;
    }

    function c() public {}
    function d() public {}

    uint public v;

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
        (true ? fExtPtr : this.d)();
        (false ? f.a : f.b)();

        (false ? Lib.w : Lib.x)();
        (false ? Lib.y : Lib.z)();

        Lib.x();
        Lib.y();
        Lib.z();

        this.v();

        uint a = 5;

        a.add(4);

        Some memory s = Some(Lib.w, fExtPtr);

        s.intFn();
        s.extFn();
    }
}`,
        [
            "this.c",
            "f.a",
            "f.b",
            "fExtPtr",
            "fExtPtr",
            "fExtPtr",
            "(true ? this.c : this.d)",
            "(true ? fExtPtr : this.d)",
            "(false ? f.a : f.b)",
            "(false ? Lib.y : Lib.z)",
            "Lib.y",
            "Lib.z",
            "this.v",
            "s.extFn"
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

            const inference = new InferType(compilerVersion);

            const writer = new ASTWriter(
                DefaultASTWriterMapping,
                new PrettyFormatter(4, 0),
                compilerVersion
            );

            const actual = units[0]
                .getChildrenByType(FunctionCall)
                .filter((node) => isFunctionCallExternal(node, inference))
                .map((node) => writer.write(node.vExpression));

            expect(actual).toEqual(expected);
        });
    }
});
