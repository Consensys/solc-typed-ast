import { gte, lt } from "semver";
import { FunctionVisibility } from ".";
import { assert, forAll, pp } from "../misc";
import { InferType } from "../types";
import { ASTNode } from "./ast_node";
import { StateVariableVisibility } from "./constants";
import { ContractDefinition } from "./implementation/declaration/contract_definition";
import { EnumDefinition } from "./implementation/declaration/enum_definition";
import { ErrorDefinition } from "./implementation/declaration/error_definition";
import { EventDefinition } from "./implementation/declaration/event_definition";
import { FunctionDefinition } from "./implementation/declaration/function_definition";
import { ModifierDefinition } from "./implementation/declaration/modifier_definition";
import { StructDefinition } from "./implementation/declaration/struct_definition";
import { UserDefinedValueTypeDefinition } from "./implementation/declaration/user_defined_value_type_definition";
import { VariableDeclaration } from "./implementation/declaration/variable_declaration";
import { ImportDirective, SourceUnit } from "./implementation/meta";
import {
    Block,
    ForStatement,
    TryCatchClause,
    UncheckedBlock,
    VariableDeclarationStatement
} from "./implementation/statement";

/**
 * Type describing the possible ASTNodes to which a given Identifier/IdentifierPath may resolve to.
 */
export type AnyResolvable =
    | VariableDeclaration
    | FunctionDefinition
    | ModifierDefinition
    | ErrorDefinition
    | EventDefinition
    | StructDefinition
    | EnumDefinition
    | ContractDefinition
    | UserDefinedValueTypeDefinition
    | ImportDirective;

/**
 * Type describing all the ASTNodes that are scopes that can define new names
 */
export type ScopeNode =
    | SourceUnit
    | ContractDefinition
    | FunctionDefinition
    | ModifierDefinition
    | VariableDeclarationStatement
    | Block
    | TryCatchClause
    | UncheckedBlock;

/**
 * Given an ASTNode `node` and a compiler version `version` determine if `node` is a
 * scope node. Note that `Block` is only a scope in 0.4.x
 */
function isScope(node: ASTNode, version: string): node is ScopeNode {
    if (lt(version, "0.5.0") && node instanceof Block) {
        return true;
    }

    return (
        node instanceof SourceUnit ||
        node instanceof ContractDefinition ||
        node instanceof FunctionDefinition ||
        node instanceof ModifierDefinition ||
        node instanceof VariableDeclarationStatement ||
        node instanceof TryCatchClause
    );
}

/**
 * Given any `ASTNode` `node` and a compiler verison `version` return the `ScopeNode` containing `node`, or undefined
 * if `node` is a top-level scope. (i.e. a `SourceUnit`)
 */
function getContainingScope(node: ASTNode, version: string): ScopeNode | undefined {
    if (node instanceof SourceUnit) {
        return undefined;
    }

    let pt = node.parent;

    while (
        pt !== undefined &&
        !(
            pt instanceof SourceUnit ||
            pt instanceof ContractDefinition ||
            pt instanceof FunctionDefinition ||
            pt instanceof ModifierDefinition ||
            pt instanceof Block ||
            pt instanceof UncheckedBlock ||
            pt instanceof ForStatement ||
            pt instanceof TryCatchClause
        )
    ) {
        node = pt;
        pt = pt.parent;
    }

    if (pt === undefined) {
        return undefined;
    }

    if (pt instanceof ForStatement) {
        if (
            node !== pt.vInitializationExpression &&
            pt.vInitializationExpression instanceof VariableDeclarationStatement
        ) {
            return pt.vInitializationExpression;
        }

        return getContainingScope(pt, version);
    }

    if (pt instanceof Block || pt instanceof UncheckedBlock) {
        if (gte(version, "0.5.0")) {
            const ptChildren = pt.children;

            for (let i = ptChildren.indexOf(node) - 1; i >= 0; i--) {
                const sibling = ptChildren[i];

                if (sibling instanceof VariableDeclarationStatement) {
                    return sibling;
                }
            }

            // Note that in >=0.5.0 Block/UncheckedBlock IS NOT a scope. VariableDeclarationStatement IS.
            return getContainingScope(pt, version);
        }
    }

    return pt;
}

/**
 * Lookup the definition corresponding to `name` in the `SourceUnit` `scope`. Yield all matches.
 */
function* lookupInSourceUnit(
    name: string,
    inference: InferType,
    scope: SourceUnit,
    visitedUnits: Set<SourceUnit>
): Iterable<AnyResolvable> {
    /**
     * Hit a cycle during lookup due to recursive imports
     */
    if (visitedUnits.has(scope)) {
        return [];
    }

    visitedUnits.add(scope);

    // Note order of checking SourceUnit children doesn't matter
    // since any conflict would result in a compilation error.
    for (const child of scope.children) {
        if (
            (child instanceof VariableDeclaration ||
                child instanceof FunctionDefinition ||
                child instanceof ContractDefinition ||
                child instanceof StructDefinition ||
                child instanceof EnumDefinition ||
                child instanceof EventDefinition ||
                child instanceof ErrorDefinition ||
                child instanceof UserDefinedValueTypeDefinition) &&
            child.name === name
        ) {
            yield child;
        }

        if (child instanceof ImportDirective) {
            if (child.unitAlias === name) {
                // `import "..." as <name>`
                yield child;
            } else if (child.vSymbolAliases.length === 0) {
                // import "..."
                // @todo maybe its better to go through child.vSourceUnit.vExportedSymbols here?
                yield* lookupInScope(name, child.vSourceUnit, inference, visitedUnits, false);
            } else {
                // `import {<name>} from "..."` or `import {a as <name>} from "..."`
                for (const [foreignDef, alias] of child.vSymbolAliases) {
                    let symImportName: string;

                    if (alias !== undefined) {
                        symImportName = alias;
                    } else {
                        if (foreignDef instanceof ImportDirective) {
                            symImportName = foreignDef.unitAlias;

                            assert(
                                symImportName !== "",
                                "Unexpected ImportDirective foreign def with non-unit alias {0}",
                                foreignDef
                            );
                        } else {
                            symImportName = foreignDef.name;
                        }
                    }

                    if (symImportName === name) {
                        yield foreignDef;
                    }
                }
            }
        }
    }
}

/**
 * Lookup the definition corresponding to `name` in the `ContractDefinition` `scope`. Yield all matches.
 */
function* lookupInContractDefinition(
    name: string,
    inference: InferType,
    scope: ContractDefinition,
    ignoreVisiblity: boolean
): Iterable<AnyResolvable> {
    const overridenSigHashes = new Set<string>();

    for (const base of scope.vLinearizedBaseContracts) {
        for (const child of base.children) {
            if (
                (child instanceof VariableDeclaration ||
                    child instanceof FunctionDefinition ||
                    child instanceof ModifierDefinition ||
                    child instanceof EventDefinition ||
                    child instanceof StructDefinition ||
                    child instanceof EnumDefinition ||
                    child instanceof ErrorDefinition ||
                    child instanceof UserDefinedValueTypeDefinition) &&
                child.name === name
            ) {
                // If we are not ignoring visibility, and the node is a private function or state var
                // in a base class different from scope, then ignore it
                if (
                    !ignoreVisiblity &&
                    ((child instanceof VariableDeclaration &&
                        child.visibility === StateVariableVisibility.Private) ||
                        (child instanceof FunctionDefinition &&
                            child.visibility === FunctionVisibility.Private)) &&
                    base !== scope
                ) {
                    continue;
                }

                const sigHash =
                    child instanceof FunctionDefinition ||
                    child instanceof EventDefinition ||
                    (child instanceof VariableDeclaration &&
                        child.visibility === StateVariableVisibility.Public)
                        ? inference.signatureHash(child)
                        : undefined;

                if (sigHash !== undefined) {
                    if (overridenSigHashes.has(sigHash)) {
                        continue;
                    }

                    overridenSigHashes.add(sigHash);
                }

                yield child;
            }
        }
    }
}

/**
 * Lookup the definition corresponding to `name` in the `FunctionDefinition` `scope`. Yield all matches.
 */
function* lookupInFunctionDefinition(
    name: string,
    scope: FunctionDefinition
): Iterable<AnyResolvable> {
    for (const paramList of [scope.vParameters, scope.vReturnParameters]) {
        for (const parameter of paramList.vParameters) {
            if (parameter.name === name) {
                yield parameter;
            }
        }
    }
}

/**
 * Lookup the definition corresponding to `name` in the `Block|UncheckedBlock` `scope`. Yield all matches.
 */
function* lookupInBlock(
    name: string,
    scope: Block | UncheckedBlock,
    inference: InferType
): Iterable<AnyResolvable> {
    let declarations: VariableDeclaration[];

    if (lt(inference.version, "0.5.0")) {
        declarations = scope.getChildrenByType(VariableDeclaration);
    } else {
        declarations = scope.children
            .filter((node) => node instanceof VariableDeclarationStatement)
            .reduce(
                (declarations: VariableDeclaration[], statement) => [
                    ...declarations,
                    ...(statement as VariableDeclarationStatement).vDeclarations
                ],
                []
            );
    }
    for (const declaration of declarations) {
        if (declaration.name === name) {
            yield declaration;
        }
    }
}

/**
 * Lookup the definition corresponding to `name` in the `ScopeNode` `node`. If no match is found return an empty set.
 * Otherwise return the set of all definitions matching by name in this scope. This function may return multuple results only in the following cases:
 * 1. Multiple FunctionDefinitions (and potentially VariableDeclarations corresponding to public state variables) with the same name and DIFFERENT SIGNATURES
 * 2. Multiple EventDefinitions with the same name and different signatures.
 */
function lookupInScope(
    name: string,
    scope: ScopeNode,
    inference: InferType,
    visitedUnits = new Set<SourceUnit>(),
    ignoreVisiblity: boolean
): Set<AnyResolvable> {
    let results: Iterable<AnyResolvable>;

    if (scope instanceof SourceUnit) {
        results = lookupInSourceUnit(name, inference, scope, visitedUnits);
    } else if (scope instanceof ContractDefinition) {
        results = lookupInContractDefinition(name, inference, scope, ignoreVisiblity);
    } else if (scope instanceof FunctionDefinition) {
        results = lookupInFunctionDefinition(name, scope);
    } else if (scope instanceof ModifierDefinition) {
        results = scope.vParameters.vParameters.filter((parameter) => parameter.name === name);
    } else if (scope instanceof VariableDeclarationStatement) {
        results = scope.vDeclarations.filter((decl) => decl.name === name);
    } else if (scope instanceof Block || scope instanceof UncheckedBlock) {
        results = lookupInBlock(name, scope, inference);
    } else if (scope instanceof TryCatchClause) {
        results = scope.vParameters
            ? scope.vParameters.vParameters.filter((param) => param.name === name)
            : [];
    } else {
        throw new Error(`Unknown scope node ${pp(scope)}`);
    }

    return new Set(results);
}

/**
 * Resolve the name `name` in the scope containing `ctx`, assuming compiler
 * version `version`. If `inclusive` is true, then if `ctx` itself is a scope,
 * lookup inside of it as well. (e.g. if ctx is the `ContractDefinition`
 * corresponding to `contract { uint x; }`, calling `resolveAny("x", node,
 * "0.5.0", true)` would return the state var X, and `resolveAny("x", node,
 * "0.5.0", false)` would return undefined.).
 *
 * Note that `name` can be an identifier path (e.g `A.B.C`).
 *
 * We return a set, since in the case where `name` resolves to a callable
 * (function/public state var) or event, there could be multiple
 * functions/events with the same name but different arguments. In all other
 * cases the returned set should have either 0 or 1 elements.
 */
export function resolveAny(
    name: string,
    ctx: ASTNode,
    inference: InferType,
    inclusive = false,
    ignoreVisiblity = false
): Set<AnyResolvable> {
    let scope: ScopeNode | undefined =
        inclusive && isScope(ctx, inference.version)
            ? ctx
            : getContainingScope(ctx, inference.version);

    const elements = name.split(".");

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        let res: Set<AnyResolvable> | undefined;

        if (i == 0) {
            // If this is the first element (e.g. `A` in `A.B.C`), walk up the
            // stack of scopes starting from the current context, looking for `A`
            while (scope !== undefined) {
                res = lookupInScope(element, scope, inference, undefined, ignoreVisiblity);

                if (res.size > 0) {
                    // Sanity check - when multiple results are found, they must either be overloaded events
                    // or overloaded functions/public state vars.
                    if (res.size > 1) {
                        assert(
                            forAll(
                                res,
                                (def) =>
                                    def instanceof EventDefinition ||
                                    def instanceof FunctionDefinition ||
                                    (def instanceof VariableDeclaration &&
                                        def.stateVariable &&
                                        def.visibility === StateVariableVisibility.Public)
                            ),
                            "Unexpected intermediate def for {0} in {1}: {2}",
                            element,
                            name,
                            res
                        );
                    }

                    const first = [...res][0];

                    // If we are resolving `A` in `A.B` skip anything that is
                    // not a contract/source unit. (e.g. constructor name in
                    // 0.4.x)
                    if (
                        elements.length == 1 ||
                        first instanceof ContractDefinition ||
                        first instanceof SourceUnit
                    ) {
                        break;
                    }
                }

                scope = getContainingScope(scope, inference.version);
            }
        } else {
            // If this is a later segment (e.g. `B` or `C` in `A.B.C`),
            // then resolve it recursively in the current scope.
            res = resolveAny(element, scope as ASTNode, inference, true, ignoreVisiblity);
        }

        // We didn't find anything - return empty set
        if (res === undefined || res.size === 0) {
            return new Set();
        }

        // This is the final segment of `A.B.C` - just return it.
        if (i >= elements.length - 1) {
            return res;
        }

        // We found multiple definitions for an intermediate segment of
        // identifier path (e.g. multiple resolutions for `A` in `A.B`). This
        // shouldn't happen.
        assert(
            res.size === 1,
            "Ambigious path resolution for {0} in {1} in ctx {2}: got {3}",
            element,
            name,
            ctx,
            res
        );

        const resolvedNode = [...res][0];

        // An intermediate segment in an identifier path (e.g. `A` in `A.B`) should always resolve to a
        // single imported source unit or contract.
        assert(
            resolvedNode instanceof ImportDirective || resolvedNode instanceof ContractDefinition,
            "Unexpected non-scope node for {0} in {1} in ctx {2}: got {3}",
            element,
            name,
            ctx,
            resolvedNode
        );

        scope = resolvedNode instanceof ImportDirective ? resolvedNode.vSourceUnit : resolvedNode;
    }

    return new Set();
}
