import expect from "expect";
import {
    ASTContext,
    ASTNodeFactory,
    ASTReader,
    compileJson,
    CompilerKind,
    compileSol,
    ContractDefinition,
    detectCompileErrors,
    EnumDefinition,
    Expression,
    FunctionDefinition,
    ModifierDefinition,
    PossibleCompilerKinds,
    replaceNode,
    StructDefinition,
    UserDefinedValueTypeDefinition,
    VariableDeclaration
} from "../../../src";

const cases: string[] = [
    "test/samples/solidity/declarations/contract_0413.sol",
    "test/samples/solidity/declarations/contract_050.sol",
    "test/samples/solidity/declarations/interface_060.sol",

    "test/samples/solidity/expressions/assignment.sol",
    "test/samples/solidity/expressions/binary_operation_0413.sol",
    "test/samples/solidity/expressions/binary_operation_050.sol",
    "test/samples/solidity/expressions/conditional_0413.sol",
    "test/samples/solidity/expressions/conditional_050.sol",
    "test/samples/solidity/expressions/tuple.sol",
    "test/samples/solidity/expressions/unary_operation_0413.sol",
    "test/samples/solidity/expressions/unary_operation_050.sol",

    "test/samples/solidity/meta/pragma.sol",
    "test/samples/solidity/meta/three_simple_contracts.sol",
    "test/samples/solidity/meta/using_for.sol",

    "test/samples/solidity/statements/block_0413.sol",
    "test/samples/solidity/statements/block_050.sol",
    "test/samples/solidity/statements/do_while_0413.sol",
    "test/samples/solidity/statements/do_while_050.sol",
    "test/samples/solidity/statements/emit_0421.sol",
    "test/samples/solidity/statements/emit_050.sol",
    "test/samples/solidity/statements/expression_0413.sol",
    "test/samples/solidity/statements/expression_050.sol",
    "test/samples/solidity/statements/for_0413.sol",
    "test/samples/solidity/statements/for_050.sol",
    "test/samples/solidity/statements/if_0413.sol",
    "test/samples/solidity/statements/if_050.sol",
    "test/samples/solidity/statements/inline_assembly_0413.sol",
    "test/samples/solidity/statements/inline_assembly_050.sol",
    "test/samples/solidity/statements/inline_assembly_060.sol",
    "test/samples/solidity/statements/placeholder_0413.sol",
    "test/samples/solidity/statements/placeholder_050.sol",
    "test/samples/solidity/statements/return_0413.sol",
    "test/samples/solidity/statements/return_050.sol",
    "test/samples/solidity/statements/throw_0413.sol",
    "test/samples/solidity/statements/variable_declaration_0413.sol",
    "test/samples/solidity/statements/variable_declaration_050.sol",
    "test/samples/solidity/statements/while_0413.sol",
    "test/samples/solidity/statements/while_050.sol",

    "test/samples/solidity/types/types.sol",

    "test/samples/solidity/latest_06.sol",
    "test/samples/solidity/latest_07.sol",
    "test/samples/solidity/latest_08.sol"
];

describe(`replaceNode() validation`, () => {
    for (const sample of cases) {
        for (const kind of PossibleCompilerKinds) {
            describe(`[${kind}] Validate replaceNode on ${sample}`, () => {
                let data: any = {};

                beforeAll(async () => {
                    const result = await (sample.endsWith(".sol")
                        ? compileSol(sample, "auto", {}, undefined, undefined, kind as CompilerKind)
                        : compileJson(sample, "auto", undefined, undefined, kind as CompilerKind));

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
                                child instanceof UserDefinedValueTypeDefinition ||
                                child instanceof VariableDeclaration
                            ) {
                                continue;
                            }

                            const parent = child.parent;
                            const childCopy = factory.copy(child);

                            expect(childCopy.parent).not.toEqual(parent);
                            expect(child.id).not.toEqual(childCopy.id);

                            expect(() => replaceNode(child, childCopy)).not.toThrow();
                            expect(childCopy.parent == parent);
                        }
                    }
                });
            });
        }
    }
});
