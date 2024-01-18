import expect from "expect";
import fse from "fs-extra";
import {
    ASTNodeConstructor,
    ASTReader,
    CompilerVersions05,
    ContractDefinition,
    EmitStatement,
    EventDefinition,
    FunctionDefinition,
    InferType,
    ModifierDefinition,
    resolve,
    resolveByName,
    resolveCallable,
    resolveEvent,
    VariableDeclaration
} from "../../../src";

type Resolvable = EventDefinition | FunctionDefinition | ModifierDefinition | VariableDeclaration;

describe("Dynamic dispatch AST utils", () => {
    const sample = "test/samples/solidity/dispatch_05.json";
    const reader = new ASTReader();

    const compilerVersion = CompilerVersions05[CompilerVersions05.length - 1];

    const inference = new InferType(compilerVersion);

    const data = fse.readJsonSync(sample);

    const [mainUnit] = reader.read(data);

    const [a, b, c, d, i] = mainUnit.vContracts;

    describe("resolve()", () => {
        const cases: Array<
            [
                ContractDefinition,
                Resolvable,
                boolean,
                [ASTNodeConstructor<Resolvable>, number] | undefined
            ]
        > = [
            [a, a.vStateVariables[0], false, [VariableDeclaration, 3]],
            [b, b.vStateVariables[0], false, [VariableDeclaration, 105]],
            [c, a.vStateVariables[0], false, [VariableDeclaration, 105]],
            [c, b.vStateVariables[0], false, [VariableDeclaration, 105]],
            [d, a.vStateVariables[0], false, undefined],
            [a, a.vStateVariables[0], true, undefined],
            [b, b.vStateVariables[0], true, [VariableDeclaration, 3]],
            [c, a.vStateVariables[0], true, [VariableDeclaration, 105]],
            [c, b.vStateVariables[0], true, [VariableDeclaration, 105]],
            [d, a.vStateVariables[0], true, undefined],

            [a, a.vEvents[0], false, [EventDefinition, 5]],
            [b, b.vEvents[0], false, [EventDefinition, 107]],
            [c, a.vEvents[0], false, [EventDefinition, 107]],
            [c, b.vEvents[0], false, [EventDefinition, 107]],
            [d, a.vEvents[0], false, undefined],
            [a, a.vEvents[0], true, undefined],
            [b, b.vEvents[0], true, [EventDefinition, 5]],
            [c, a.vEvents[0], true, [EventDefinition, 107]],
            [c, b.vEvents[0], true, [EventDefinition, 107]],
            [d, a.vEvents[0], true, undefined],

            [a, a.vModifiers[0], false, [ModifierDefinition, 9]],
            [b, b.vModifiers[0], false, [ModifierDefinition, 111]],
            [c, a.vModifiers[0], false, [ModifierDefinition, 111]],
            [c, b.vModifiers[0], false, [ModifierDefinition, 111]],
            [d, a.vModifiers[0], false, undefined],
            [a, a.vModifiers[0], true, undefined],
            [b, b.vModifiers[0], true, [ModifierDefinition, 9]],
            [c, a.vModifiers[0], true, [ModifierDefinition, 111]],
            [c, b.vModifiers[0], true, [ModifierDefinition, 111]],
            [d, a.vModifiers[0], true, undefined],

            [a, a.vFunctions[2], false, [FunctionDefinition, 40]],
            [b, b.vFunctions[1], false, [FunctionDefinition, 126]],
            [c, a.vFunctions[2], false, [FunctionDefinition, 126]],
            [c, b.vFunctions[1], false, [FunctionDefinition, 126]],
            [d, a.vFunctions[2], false, undefined],
            [a, a.vFunctions[2], true, undefined],
            [b, b.vFunctions[1], true, [FunctionDefinition, 40]],
            [c, a.vFunctions[2], true, [FunctionDefinition, 126]],
            [c, b.vFunctions[1], true, [FunctionDefinition, 126]],
            [d, a.vFunctions[2], true, undefined]
        ];

        for (const [scope, resolvable, onlyParents, expectation] of cases) {
            const definer = resolvable.vScope as ContractDefinition;

            it(`${resolvable.name} of ${definer.name} for ${scope.name}`, () => {
                const node = resolve(scope, resolvable, inference, onlyParents);

                if (expectation === undefined) {
                    expect(node === undefined).toEqual(true);
                } else {
                    const [constr, id] = expectation;

                    expect(node).toBeInstanceOf(constr);
                    expect((node as Resolvable).id).toEqual(id);
                }
            });
        }
    });

    describe("resolveByName()", () => {
        const cases: Array<
            [
                ContractDefinition,
                ASTNodeConstructor<Resolvable>,
                string,
                boolean,
                Array<[ASTNodeConstructor<Resolvable>, number]>
            ]
        > = [
            [a, VariableDeclaration, "v", false, [[VariableDeclaration, 3]]],
            [b, VariableDeclaration, "v", false, [[VariableDeclaration, 105]]],
            [c, VariableDeclaration, "v", false, [[VariableDeclaration, 105]]],
            [a, VariableDeclaration, "v", true, []],
            [b, VariableDeclaration, "v", true, [[VariableDeclaration, 3]]],
            [c, VariableDeclaration, "v", true, [[VariableDeclaration, 105]]],

            [a, EventDefinition, "Ev", false, [[EventDefinition, 5]]],
            [b, EventDefinition, "Ev", false, [[EventDefinition, 107]]],
            [c, EventDefinition, "Ev", false, [[EventDefinition, 107]]],
            [a, EventDefinition, "Ev", true, []],
            [b, EventDefinition, "Ev", true, [[EventDefinition, 5]]],
            [c, EventDefinition, "Ev", true, [[EventDefinition, 107]]],

            [a, ModifierDefinition, "mod", false, [[ModifierDefinition, 9]]],
            [b, ModifierDefinition, "mod", false, [[ModifierDefinition, 111]]],
            [c, ModifierDefinition, "mod", false, [[ModifierDefinition, 111]]],
            [a, ModifierDefinition, "mod", true, []],
            [b, ModifierDefinition, "mod", true, [[ModifierDefinition, 9]]],
            [c, ModifierDefinition, "mod", true, [[ModifierDefinition, 111]]],

            [a, FunctionDefinition, "fn", false, [[FunctionDefinition, 40]]],
            [b, FunctionDefinition, "fn", false, [[FunctionDefinition, 126]]],
            [c, FunctionDefinition, "fn", false, [[FunctionDefinition, 126]]],
            [a, FunctionDefinition, "fn", true, []],
            [b, FunctionDefinition, "fn", true, [[FunctionDefinition, 40]]],
            [c, FunctionDefinition, "fn", true, [[FunctionDefinition, 126]]]
        ];

        for (const [scope, kind, name, onlyParents, expectations] of cases) {
            it(`${kind.name} ${name} for ${scope.name} (only parents: ${onlyParents})`, () => {
                const result = resolveByName(scope, kind, name, inference, onlyParents);

                expect(result.length).toEqual(expectations.length);

                for (let idx = 0; idx < expectations.length; idx++) {
                    const [constr, id] = expectations[idx];
                    const node = result[idx];

                    expect(node).toBeDefined();
                    expect(node).toBeInstanceOf(constr);
                    expect(node.id).toEqual(id);
                }
            });
        }
    });

    describe("resolveByName()", () => {
        const emits = mainUnit.getChildrenByType(EmitStatement);
        const cases: Array<[ContractDefinition, EmitStatement, number]> = [
            [a, emits[0], 5],
            [a, emits[1], 5],
            [b, emits[2], 5],
            [b, emits[3], 107],
            [b, emits[4], 107],
            [c, emits[2], 5],
            [c, emits[3], 107],
            [c, emits[4], 107]
        ];

        for (const [scope, stmt, id] of cases) {
            it(`${stmt.type}#${stmt.id} for ${scope.name}`, () => {
                const node = resolveEvent(scope, stmt, inference);

                expect(node).toBeInstanceOf(EventDefinition);
                expect((node as EventDefinition).id).toEqual(id);
            });
        }
    });

    describe("resolveCallable()", () => {
        const cases: Array<
            [
                ContractDefinition,
                VariableDeclaration | FunctionDefinition,
                boolean,
                [ASTNodeConstructor<VariableDeclaration | FunctionDefinition>, number] | undefined
            ]
        > = [
            [a, a.vStateVariables[0], false, [VariableDeclaration, 3]],
            [b, a.vStateVariables[0], false, [VariableDeclaration, 105]],
            [c, a.vStateVariables[0], false, [VariableDeclaration, 105]],
            [a, b.vStateVariables[0], false, [VariableDeclaration, 3]],
            [b, b.vStateVariables[0], false, [VariableDeclaration, 105]],
            [c, b.vStateVariables[0], false, [VariableDeclaration, 105]],
            [a, a.vStateVariables[0], true, undefined],
            [b, a.vStateVariables[0], true, [VariableDeclaration, 3]],
            [c, a.vStateVariables[0], true, [VariableDeclaration, 105]],
            [a, b.vStateVariables[0], true, undefined],
            [b, b.vStateVariables[0], true, [VariableDeclaration, 3]],
            [c, b.vStateVariables[0], true, [VariableDeclaration, 105]],
            [a, a.vFunctions[2], false, [FunctionDefinition, 40]],
            [b, b.vFunctions[1], false, [FunctionDefinition, 126]],
            [c, b.vFunctions[1], false, [FunctionDefinition, 126]],
            [a, b.vFunctions[1], false, [FunctionDefinition, 40]],
            [d, a.vFunctions[2], false, undefined],
            [a, i.vFunctions[0], false, [VariableDeclaration, 3]],
            [b, i.vFunctions[0], false, [VariableDeclaration, 105]],
            [a, a.vFunctions[2], true, undefined],
            [b, b.vFunctions[1], true, [FunctionDefinition, 40]],
            [c, b.vFunctions[1], true, [FunctionDefinition, 126]],
            [a, b.vFunctions[1], true, undefined],
            [d, a.vFunctions[2], true, undefined],
            [a, i.vFunctions[0], true, undefined],
            [b, i.vFunctions[0], true, [VariableDeclaration, 3]]
        ];

        for (const [scope, resolvable, onlyParents, expectation] of cases) {
            const definer = resolvable.vScope as ContractDefinition;

            it(`${resolvable.name} of ${definer.name} for ${scope.name}`, () => {
                const node = resolveCallable(scope, resolvable, inference, onlyParents);

                if (expectation === undefined) {
                    expect(node === undefined).toEqual(true);
                } else {
                    const [constr, id] = expectation;

                    expect(node).toBeInstanceOf(constr);
                    expect((node as Resolvable).id).toEqual(id);
                }
            });
        }
    });
});
