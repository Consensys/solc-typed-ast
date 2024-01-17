import expect from "expect";
import {
    assert,
    ASTReader,
    compileSol,
    detectCompileErrors,
    evalConstantExpr,
    Expression,
    InferType,
    LatestCompilerVersion,
    SourceUnit,
    Value,
    VariableDeclaration,
    XPath
} from "../../src";

const cases: Array<[string, Array<[string, Value]>]> = [
    [
        "test/samples/solidity/consts/consts.sol",
        [
            ["//VariableDeclaration[@name='SOME_CONST']", 100n],
            ["//VariableDeclaration[@name='SOME_OTHER']", 15n],
            ["//VariableDeclaration[@name='SOME_ELSE']", 115n],
            ["//VariableDeclaration[@name='C2']", 158n],
            ["//VariableDeclaration[@name='C3']", 158n],
            [
                "//VariableDeclaration[@name='C4']",
                115792089237316195423570985008687907853269984665640564039457584007913129639836n
            ],
            ["//VariableDeclaration[@name='C5']", false],
            ["//VariableDeclaration[@name='C6']", 158n],
            ["//VariableDeclaration[@name='C7']", 85n],

            ["//VariableDeclaration[@name='FOO']", "abcd"],
            ["//VariableDeclaration[@name='BOO']", Buffer.from("abcd", "utf-8")],
            ["//VariableDeclaration[@name='MOO']", 97n],
            ["//VariableDeclaration[@name='WOO']", "abcd"],

            ["//VariableDeclaration[@name='U16S']", 30841n],
            ["//VariableDeclaration[@name='U16B']", 30841n],
            ["//VariableDeclaration[@name='B2U']", 258n],
            ["//VariableDeclaration[@name='NON_UTF8_SEQ']", Buffer.from("7532eaac", "hex")]
        ]
    ]
];

describe("Constant expression evaluator integration test", () => {
    for (const [sample, mapping] of cases) {
        describe(sample, () => {
            let units: SourceUnit[];
            let inference: InferType;

            beforeAll(async () => {
                const result = await compileSol(sample, "auto");

                const data = result.data;
                const compilerVersion = result.compilerVersion || LatestCompilerVersion;

                const errors = detectCompileErrors(data);

                expect(errors).toHaveLength(0);

                const reader = new ASTReader();

                units = reader.read(data);

                expect(units.length).toBeGreaterThanOrEqual(1);

                inference = new InferType(compilerVersion);
            });

            for (const [selector, expectation] of mapping) {
                let found = false;

                it(`${selector} -> ${expectation}`, () => {
                    for (const unit of units) {
                        const results = new XPath(unit).query(selector);

                        if (results.length > 0) {
                            const [expr] = results;

                            assert(
                                expr instanceof Expression || expr instanceof VariableDeclaration,
                                `Expected selector result to be an {0} or {1} descendant, got {2} instead`,
                                Expression.name,
                                VariableDeclaration.name,
                                expr
                            );

                            found = true;

                            expect(evalConstantExpr(expr, inference)).toEqual(expectation);

                            break;
                        }
                    }

                    assert(
                        found,
                        `Selector "{0}" not found in source units of sample "{1}"`,
                        selector,
                        sample
                    );
                });
            }
        });
    }
});
