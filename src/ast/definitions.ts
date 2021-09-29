import { gte, lt } from "semver";
import { forAll } from "../misc";
import { ABIEncoderVersion } from "../types/abi";
import { ASTNode } from "./ast_node";
import { StateVariableVisibility } from "./constants";
import { EnumDefinition, StructDefinition } from "./implementation/declaration";
import { ContractDefinition } from "./implementation/declaration/contract_definition";
import { ErrorDefinition } from "./implementation/declaration/error_definition";
import { EventDefinition } from "./implementation/declaration/event_definition";
import { FunctionDefinition } from "./implementation/declaration/function_definition";
import { ModifierDefinition } from "./implementation/declaration/modifier_definition";
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

function pp(n: ASTNode | undefined): string {
    return n !== undefined ? `${n.constructor.name}#${n.id}` : "undefined";
}

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
function* lookupInSourceUnit(name: string, scope: SourceUnit): Iterable<AnyResolvable> {
    // Note order of checking SourceUnit children doesn't matter
    // since any conflict would result in a compilation error.
    for (const child of scope.children) {
        if (
            (child instanceof VariableDeclaration ||
                child instanceof FunctionDefinition ||
                child instanceof ContractDefinition ||
                child instanceof StructDefinition ||
                child instanceof EnumDefinition ||
                child instanceof ErrorDefinition) &&
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
                for (const def of lookupInScope(name, child.vSourceUnit)) {
                    yield def;
                }
            } else {
                // `import {<name>} from "..."` or `import {a as <name>} from "..."`
                for (const [foreignDef, alias] of child.vSymbolAliases) {
                    let symImportName: string;

                    if (alias !== undefined) {
                        symImportName = alias;
                    } else {
                        if (foreignDef instanceof ImportDirective) {
                            symImportName = foreignDef.unitAlias;

                            if (symImportName === "") {
                                throw new Error(
                                    `Unexpected ImportDirective foreign def with non-unit alias ${pp(
                                        foreignDef
                                    )}`
                                );
                            }
                        } else {
                            symImportName = foreignDef.name;
                        }
                    }

                    if (alias === name) {
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
    scope: ContractDefinition
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
                    child instanceof ErrorDefinition) &&
                child.name === name
            ) {
                let sigHash: string | undefined;

                if (child instanceof FunctionDefinition) {
                    // Its a safe to assume V2 as its backward-compatible and
                    // we only use it internally here
                    sigHash = child.canonicalSignatureHash(ABIEncoderVersion.V2);
                } else if (
                    child instanceof VariableDeclaration &&
                    child.visibility === StateVariableVisibility.Public
                ) {
                    // Its a safe to assume V2 as its backward-compatible and
                    // we only use it internally here
                    sigHash = child.getterCanonicalSignatureHash(ABIEncoderVersion.V2);
                }

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
function* lookupInBlock(name: string, scope: Block | UncheckedBlock): Iterable<AnyResolvable> {
    for (const node of scope.children) {
        if (!(node instanceof VariableDeclarationStatement)) {
            continue;
        }

        for (const decl of node.vDeclarations) {
            if (decl.name === name) {
                yield decl;
            }
        }
    }
}

/**
 * Lookup the definition corresponding to `name` in the `ScopeNode` `node`. If no match is found return an empty set.
 * Otherwise return the set of all definitions matching by name in this scope. This function may return multuple results only in the following cases:
 * 1. Multiple FunctionDefinitions (and potentially VariableDeclarations corresponding to public state variables) with the same name and DIFFERENT SIGNATURES
 * 2. Multiple EventDefinitions with the same name and different signatures.
 */
function lookupInScope(name: string, scope: ScopeNode): Set<AnyResolvable> {
    let results: Iterable<AnyResolvable>;

    if (scope instanceof SourceUnit) {
        results = lookupInSourceUnit(name, scope);
    } else if (scope instanceof ContractDefinition) {
        results = lookupInContractDefinition(name, scope);
    } else if (scope instanceof FunctionDefinition) {
        results = lookupInFunctionDefinition(name, scope);
    } else if (scope instanceof ModifierDefinition) {
        results = scope.vParameters.vParameters.filter((parameter) => parameter.name === name);
    } else if (scope instanceof VariableDeclarationStatement) {
        results = scope.vDeclarations.filter((decl) => decl.name === name);
    } else if (scope instanceof Block || scope instanceof UncheckedBlock) {
        results = lookupInBlock(name, scope);
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
    version: string,
    inclusive = false
): Set<AnyResolvable> {
    let scope: ScopeNode | undefined =
        inclusive && isScope(ctx, version) ? ctx : getContainingScope(ctx, version);

    const elements = name.split(".");

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        let res: Set<AnyResolvable> | undefined;

        if (i == 0) {
            // If this is the first element (e.g. `A` in `A.B.C`), walk up the
            // stack of scopes starting from the current context, looking for `A`
            while (scope !== undefined) {
                res = lookupInScope(element, scope);

                if (res.size > 0) {
                    // Sanity check - when multiple results are found, they must either be overloaded events
                    // or overloaded functions/public state vars.
                    if (res.size > 1) {
                        if (
                            !forAll(
                                res,
                                (def) =>
                                    def instanceof EventDefinition ||
                                    def instanceof FunctionDefinition ||
                                    (def instanceof VariableDeclaration &&
                                        def.stateVariable &&
                                        def.visibility === StateVariableVisibility.Public)
                            )
                        ) {
                            throw new Error(
                                `Unexpected intermediate def for ${element} in ${name}: ${[
                                    ...res
                                ].map((n) => `${n.constructor.name}#${n.id}`)}`
                            );
                        }
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

                scope = getContainingScope(scope, version);
            }
        } else {
            // If this is a later segment (e.g. `B` or `C` in `A.B.C`),
            // then resolve it recursively in the current scope.
            res = resolveAny(element, scope as ASTNode, version, true);
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
        if (res.size > 1) {
            throw new Error(
                `Ambigious path resolution for ${element} in ${name} in ctx ${pp(ctx)}: got ${[
                    ...res
                ]
                    .map(pp)
                    .join(",")}`
            );
        }

        const resolvedNode = [...res][0];

        // An intermediate segment in an identifier path (e.g. `A` in `A.B`) should always resolve to a
        // single imported source unit or contract.
        if (
            !(resolvedNode instanceof ImportDirective || resolvedNode instanceof ContractDefinition)
        ) {
            throw new Error(
                `Unexpected non-scope node for ${element} in ${name} in ctx ${pp(ctx)}: got ${pp(
                    resolvedNode
                )}`
            );
        }

        scope = resolvedNode instanceof ImportDirective ? resolvedNode.vSourceUnit : resolvedNode;
    }

    return new Set();
}
