import expect from "expect";
import {
    ASTContext,
    ASTNodeFactory,
    ASTReader,
    compileJson,
    compileSol,
    ContractDefinition,
    detectCompileErrors,
    EnumDefinition,
    Expression,
    FunctionDefinition,
    isSane,
    ModifierDefinition,
    replaceNode,
    StructDefinition,
    VariableDeclaration
} from "../../../src";

const cases: string[] = [
    "test/samples/solidity/latest_06.sol",
    "test/samples/solidity/latest_07.sol",
    "test/samples/solidity/latest_08.sol"
];

describe(`replaceNode() validation`, () => {
    for (const sample of cases) {
        describe(`Validate replaceNode on ${sample}`, () => {
            let data: any = {};

            before("Compile", () => {
                const result = sample.endsWith(".sol")
                    ? compileSol(sample, "auto", [])
                    : compileJson(sample, "auto", []);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                data = result.data;
            });

            it("Validate copying results", () => {
                const context = new ASTContext();

                context.id = 1000;

                const reader = new ASTReader(context);

                const units = reader.read(data);

                const factory = new ASTNodeFactory(context);

                for (const unit of units) {
                    for (const child of unit.getChildrenByType(Expression)) {
                        // Skip replacing nodes that may be referenced by vReferencedDeclaration
                        if (
                            child instanceof ContractDefinition ||
                            child instanceof FunctionDefinition ||
                            child instanceof ModifierDefinition ||
                            child instanceof StructDefinition ||
                            child instanceof EnumDefinition ||
                            child instanceof VariableDeclaration
                        ) {
                            continue;
                        }
                        const parent = child.parent;
                        const childCopy = factory.copy(child);

                        expect(childCopy.parent).not.toEqual(parent);
                        expect(child.id).not.toEqual(childCopy.id);

                        expect(replaceNode.bind(replaceNode, child, childCopy)).not.toThrow();
                        expect(childCopy.parent == parent);
                    }

                    expect(isSane(unit, context)).toBeTruthy();
                }
            });
        });
    }
});
