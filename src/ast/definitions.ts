import { gte, lt } from "semver";
import { ASTNode } from "./ast_node";
import { StateVariableVisibility } from "./constants";
import { EnumDefinition, StructDefinition } from "./implementation/declaration";
import { ContractDefinition } from "./implementation/declaration/contract_definition";
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
    | EventDefinition
    | StructDefinition
    | EnumDefinition
    | ContractDefinition
    | SourceUnit;

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
 * scope node. Note that `Block` and `UncheckedBlock` are only scopes in 0.4.x
 */
function isScope(node: ASTNode, version: string): node is ScopeNode {
    if (lt(version, "0.5.0") && (node instanceof Block || node instanceof UncheckedBlock)) {
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
 * Lookup the definition corresponding to `name` in the `ScopeNode` `node`. If no match is found return an empty set.
 * Otherwise return the set of all definitions matching by name in this scope. This function may return multuple results only in the following cases:
 * 1. Multiple FunctionDefinitions (and potentially VariableDeclarations corresponding to public state variables) with the same name and DIFFERENT SIGNATURES
 * 2. Multiple EventDefinitions with the same name and different signatures.
 */
function lookupInScope(name: string, scope: ScopeNode): Set<AnyResolvable> {
    const res: Set<AnyResolvable> = new Set();

    if (scope instanceof SourceUnit) {
        // Note order of checking SourceUnit children doesn't matter
        // since any conflict would result in a compilation error.
        for (const child of scope.children) {
            if (
                (child instanceof VariableDeclaration ||
                    child instanceof FunctionDefinition ||
                    child instanceof ContractDefinition ||
                    child instanceof StructDefinition ||
                    child instanceof EnumDefinition) &&
                child.name === name
            ) {
                res.add(child);
            }

            if (child instanceof ImportDirective) {
                if (child.unitAlias === name) {
                    // `import "..." as <name>`
                    res.add(child.vSourceUnit);
                } else if (child.vSymbolAliases.length === 0) {
                    // import "..."
                    // @todo maybe its better to go through child.vSourceUnit.vExportedSymbols here?
                    for (const def of lookupInScope(name, child.vSourceUnit)) {
                        res.add(def);
                    }
                } else {
                    // `import {<name>} from "..."` or `import {a as <name>} from "..."`
                    for (const [foreignDef, alias] of child.vSymbolAliases) {
                        let symImportName: string;
                        const originalDef =
                            foreignDef instanceof ImportDirective
                                ? foreignDef.vSourceUnit
                                : foreignDef;

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
                            res.add(originalDef);
                        }
                    }
                }
            }
        }
    } else if (scope instanceof ContractDefinition) {
        const overridenSigHashes = new Set<string>();
        for (const base of scope.vLinearizedBaseContracts) {
            for (const child of base.children) {
                if (
                    (child instanceof VariableDeclaration ||
                        child instanceof FunctionDefinition ||
                        child instanceof ModifierDefinition ||
                        child instanceof EventDefinition ||
                        child instanceof StructDefinition ||
                        child instanceof EnumDefinition) &&
                    child.name === name
                ) {
                    let sigHash: string | undefined;
                    if (child instanceof FunctionDefinition) {
                        sigHash = child.canonicalSignatureHash;
                    } else if (
                        child instanceof VariableDeclaration &&
                        child.visibility === StateVariableVisibility.Public
                    ) {
                        sigHash = child.getterCanonicalSignatureHash;
                    }

                    if (sigHash !== undefined) {
                        if (overridenSigHashes.has(sigHash)) {
                            continue;
                        }

                        overridenSigHashes.add(sigHash);
                    }

                    res.add(child);
                }
            }
        }
    } else if (scope instanceof FunctionDefinition) {
        for (const paramList of [scope.vParameters, scope.vReturnParameters]) {
            for (const parameter of paramList.vParameters) {
                if (parameter.name === name) {
                    res.add(parameter);
                }
            }
        }
    } else if (scope instanceof ModifierDefinition) {
        for (const parameter of scope.vParameters.vParameters) {
            if (parameter.name === name) {
                res.add(parameter);
            }
        }
    } else if (scope instanceof VariableDeclarationStatement) {
        for (const decl of scope.vDeclarations) {
            if (decl.name === name) {
                res.add(decl);
            }
        }
    } else if (scope instanceof Block || scope instanceof UncheckedBlock) {
        for (const node of scope.children) {
            if (!(node instanceof VariableDeclarationStatement)) {
                continue;
            }

            for (const decl of node.vDeclarations) {
                if (decl.name === name) {
                    res.add(decl);
                }
            }
        }
    } else if (scope instanceof TryCatchClause) {
        if (scope.vParameters) {
            for (const decl of scope.vParameters.vParameters) {
                if (decl.name === name) {
                    res.add(decl);
                }
            }
        }
    } else {
        throw new Error(`Unknown scope node ${pp(scope)}`);
    }

    return res;
}

/**
 * Resolve the name `name` in the scope containing `ctx`, assuming compiler
 * version `version`. If `inclusive` is true, then if `ctx` itself is a scope,
 * lookup inside of it as well. (e.g. if ctx is the `ContractDefinition`
 * corresponding to `contract { uint x; }`, calling `resolveAny("x", node,
 * "0.5.0", true)` would return the state var X, and `resolveAny("x", node,
 * "0.5.0", false)` would return undefined.).
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
    let scope: ScopeNode | undefined;

    if (inclusive && isScope(ctx, version)) {
        scope = ctx;
    } else {
        scope = getContainingScope(ctx, version);
    }

    while (scope !== undefined) {
        const inScopeRes = lookupInScope(name, scope);
        if (inScopeRes.size > 0) {
            // Sanity check for the case where multiple values are returned.
            // @todo re-write - this check is ugly
            if (inScopeRes.size > 1) {
                let isEvents: boolean | undefined;
                for (const def of inScopeRes) {
                    if (isEvents === undefined) {
                        isEvents = def instanceof EventDefinition;
                    }

                    if (isEvents) {
                        if (!(def instanceof EventDefinition)) {
                            throw new Error(`Expected all overriden event definitions`);
                        }
                    } else {
                        if (
                            !(
                                (def instanceof VariableDeclaration &&
                                    def.stateVariable &&
                                    def.visibility === StateVariableVisibility.Public) ||
                                def instanceof FunctionDefinition
                            )
                        ) {
                            throw new Error(`Expected all function/public vars`);
                        }
                    }
                }
            }
            return inScopeRes;
        }

        scope = getContainingScope(scope, version);
    }

    return new Set();
}
