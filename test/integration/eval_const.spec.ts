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
            ["//VariableDeclaration[@id=5]", 100n],
            ["//VariableDeclaration[@id=8]", 15n],
            ["//VariableDeclaration[@id=13]", 115n],
            ["//VariableDeclaration[@id=18]", 158n],
            ["//VariableDeclaration[@id=24]", 158n],
            ["//VariableDeclaration[@id=31]", false],
            ["//VariableDeclaration[@id=37]", 158n],
            ["//VariableDeclaration[@id=44]", 85n],
            ["//VariableDeclaration[@id=47]", "abcd"],
            ["//VariableDeclaration[@id=53]", Buffer.from("abcd", "utf-8")],
            ["//VariableDeclaration[@id=58]", 97n],
            ["//VariableDeclaration[@id=64]", "abcd"],
            ["//VariableDeclaration[@id=73]", 30841n],
            ["//VariableDeclaration[@id=82]", 30841n],
            ["//VariableDeclaration[@id=88]", 258n]
        ]
    ]
];

describe("Constant expression evaluator integration test", () => {
    for (const [sample, mapping] of cases) {
        describe(sample, () => {
            let units: SourceUnit[];
            let inference: InferType;

            before(async () => {
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
