import { InferType } from "../types";
import { ASTNodeConstructor } from "./ast_node";
import { StateVariableVisibility } from "./constants";
import { ContractDefinition } from "./implementation/declaration/contract_definition";
import { EventDefinition } from "./implementation/declaration/event_definition";
import { FunctionDefinition } from "./implementation/declaration/function_definition";
import { ModifierDefinition } from "./implementation/declaration/modifier_definition";
import { VariableDeclaration } from "./implementation/declaration/variable_declaration";
import { FunctionCall } from "./implementation/expression/function_call";
import { Identifier } from "./implementation/expression/identifier";
import { MemberAccess } from "./implementation/expression/member_access";
import { EmitStatement } from "./implementation/statement/emit_statement";

type FunctionLikeResolvable = FunctionDefinition | ModifierDefinition | EventDefinition;
type Resolvable = FunctionLikeResolvable | VariableDeclaration;

function getResolvableCollection(
    contract: ContractDefinition,
    target: ASTNodeConstructor<Resolvable>
): readonly Resolvable[] {
    if (target === FunctionDefinition) {
        return contract.vFunctions;
    }

    if (target === ModifierDefinition) {
        return contract.vModifiers;
    }

    if (target === EventDefinition) {
        return contract.vEvents;
    }

    if (target === VariableDeclaration) {
        return contract.vStateVariables;
    }

    throw new Error("Unable to select resolvable collection for target " + target.name);
}

export function resolve<T extends Resolvable>(
    scope: ContractDefinition,
    target: T,
    inference: InferType,
    onlyParents = false
): T | undefined {
    let finder: (candidate: Resolvable) => boolean;

    if (target instanceof VariableDeclaration) {
        finder = (candidate) => candidate.name === target.name;
    } else {
        const signatureHash = inference.signatureHash(target);

        finder = (candidate) => signatureHash === inference.signatureHash(candidate);
    }

    for (const base of scope.vLinearizedBaseContracts) {
        if (onlyParents && base === scope) {
            continue;
        }

        const collection = getResolvableCollection(
            base,
            target.constructor as ASTNodeConstructor<T>
        );

        const result = collection.find(finder);

        if (result) {
            return result as T;
        }
    }

    return undefined;
}

/**
 * Resolve an inheritable contract property following the standard C3 linearization order.
 *
 * @param constructor The class constructor of the type of contract
 *   property we are resolving. One of `FunctionDefinition`,
 *   `ModifierDefinition`, `EventDefinition` or `VariableDeclaration`
 * @param name Name of the property we are attempting to resolve. Note that
 *   if we are resolving functions or events there may be multiple results as
 *   functions/events can have the same name and different arguments
 * @param onlyParents boolean flag specifing that we want to only look through the bases of the contract.
 */
export function resolveByName<T extends Resolvable>(
    scope: ContractDefinition,
    constructor: ASTNodeConstructor<T>,
    name: string,
    inference: InferType,
    onlyParents = false
): T[] {
    const result = [];
    const found = new Set<string>();

    for (const base of scope.vLinearizedBaseContracts) {
        if (onlyParents && base === scope) {
            continue;
        }

        const collection = getResolvableCollection(base, constructor);

        for (const resolvable of collection) {
            /**
             * We use `resolvableIdentifier` to avoid adding already-overloaded functions
             * into the resolved set.
             * (Its safe to assume ABIEncoderVersionV2 as its backwards
             * compatible, and we only use it internally here.)
             */
            const resolvableIdentifier =
                resolvable instanceof VariableDeclaration
                    ? resolvable.name
                    : inference.signatureHash(resolvable);

            if (resolvable.name === name && !found.has(resolvableIdentifier)) {
                result.push(resolvable as T);

                found.add(resolvableIdentifier);
            }
        }
    }

    return result;
}

function isExplicitlyBound(call: FunctionCall): boolean {
    if (call.vExpression instanceof MemberAccess) {
        const expression = call.vExpression.vExpression;

        if (
            expression instanceof Identifier &&
            expression.vReferencedDeclaration instanceof ContractDefinition
        ) {
            return true;
        }
    }

    return false;
}

export function resolveEvent(
    scope: ContractDefinition,
    statement: EmitStatement,
    inference: InferType,
    onlyParents = false
): EventDefinition | undefined {
    const call = statement.vEventCall;
    const definition = call.vReferencedDeclaration;

    if (definition instanceof EventDefinition) {
        return isExplicitlyBound(call)
            ? definition
            : resolve(scope, definition, inference, onlyParents);
    }

    return undefined;
}

export function resolveCallable(
    scope: ContractDefinition,
    definition: FunctionDefinition | VariableDeclaration,
    inference: InferType,
    onlyParents = false
): FunctionDefinition | VariableDeclaration | undefined {
    const selector = inference.signatureHash(definition);

    for (const base of scope.vLinearizedBaseContracts) {
        if (onlyParents && base === scope) {
            continue;
        }

        for (const fn of base.vFunctions) {
            if (inference.signatureHash(fn) === selector) {
                return fn;
            }
        }

        for (const v of base.vStateVariables) {
            if (v.visibility === StateVariableVisibility.Public) {
                if (inference.signatureHash(v) === selector) {
                    return v;
                }
            }
        }
    }

    return undefined;
}
