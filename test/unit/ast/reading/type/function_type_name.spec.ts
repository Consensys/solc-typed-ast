import expect from "expect";
import {
    ASTReader,
    compileJson,
    FunctionStateMutability,
    FunctionTypeName,
    FunctionVisibility,
    ParameterList,
    VariableDeclaration
} from "../../../../../src";

describe("FunctionTypeName", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/types/types_0413.json"],
        ["0.5.0", "test/samples/solidity/types/types_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let nodes: FunctionTypeName[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                nodes = mainUnit.getChildrenByType(FunctionTypeName);
            });

            it("Detect correct number of nodes", () => {
                expect(nodes.length).toEqual(1);
            });

            it("function (uint) internal returns (int)", () => {
                const fnType = nodes[0];

                expect(fnType.id).toEqual(52);
                expect(fnType.typeString).toEqual("function (uint256) returns (int256)");
                expect(fnType instanceof FunctionTypeName).toEqual(true);
                expect(fnType.visibility).toEqual(FunctionVisibility.Internal);
                expect(fnType.stateMutability).toEqual(FunctionStateMutability.NonPayable);

                const args = fnType.vParameterTypes;

                expect(args instanceof ParameterList).toEqual(true);
                expect(args.id).toEqual(48);
                expect(args.children.length).toEqual(1);
                expect(args.children[0] instanceof VariableDeclaration).toEqual(true);
                expect(args.children[0].id).toEqual(47);

                const returns = fnType.vReturnParameterTypes;

                expect(returns instanceof ParameterList).toEqual(true);
                expect(returns.id).toEqual(51);
                expect(returns.children.length).toEqual(1);
                expect(returns.children[0] instanceof VariableDeclaration).toEqual(true);
                expect(returns.children[0].id).toEqual(50);
            });
        });
    }
});
