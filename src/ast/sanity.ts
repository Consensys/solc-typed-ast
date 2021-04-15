import {
    ArrayTypeName,
    Assignment,
    ASTContext,
    ASTNode,
    BinaryOperation,
    Block,
    Break,
    Conditional,
    Continue,
    ContractDefinition,
    DoWhileStatement,
    ElementaryTypeName,
    ElementaryTypeNameExpression,
    EmitStatement,
    EnumDefinition,
    EnumValue,
    EventDefinition,
    ExpressionStatement,
    ForStatement,
    FunctionCall,
    FunctionCallOptions,
    FunctionDefinition,
    FunctionTypeName,
    Identifier,
    IdentifierPath,
    IfStatement,
    ImportDirective,
    IndexAccess,
    IndexRangeAccess,
    InheritanceSpecifier,
    InlineAssembly,
    Literal,
    Mapping,
    MemberAccess,
    ModifierDefinition,
    ModifierInvocation,
    NewExpression,
    OverrideSpecifier,
    ParameterList,
    PlaceholderStatement,
    PragmaDirective,
    Return,
    SourceUnit,
    StructDefinition,
    StructuredDocumentation,
    Throw,
    TryCatchClause,
    TryStatement,
    TupleExpression,
    UnaryOperation,
    UserDefinedTypeName,
    UsingForDirective,
    VariableDeclaration,
    VariableDeclarationStatement,
    WhileStatement
} from ".";
import { UncheckedBlock } from "./implementation/statement";

/**
 * Helper function to check if the node/nodes `arg` is in the `ASTContext` `ctx`.
 */
function inCtx(arg: ASTNode | ASTNode[], ctx: ASTContext): boolean {
    if (arg instanceof ASTNode) {
        return ctx.contains(arg);
    }

    for (const node of arg) {
        if (!inCtx(node, ctx)) {
            return false;
        }
    }

    return true;
}

/**
 * Error thrown by `checkSanity` that describes a problem with the AST
 */
export class InsaneASTError extends Error {}

function pp(node: ASTNode | ASTContext | undefined): string {
    return node === undefined ? `undefined` : `${node.constructor.name}#${node.id}`;
}

/**
 * Check that the property `prop` of an `ASTNode` `node` is either an `ASTNode`
 * in the expected `ASTContext` `ctx` or an array `ASTNode[]` all of which are in
 * the expected `ASTContext`
 */
function checkVFieldCtx<T extends ASTNode, K extends keyof T>(
    node: T,
    prop: K,
    ctx: ASTContext
): void {
    const val: T[K] = node[prop];
    if (val instanceof ASTNode) {
        if (!inCtx(val, ctx)) {
            throw new Error(
                `Node ${pp(node)} property ${prop} ${pp(val)} not in expected context ${pp(
                    ctx
                )}. Instead in ${pp(val.context)}`
            );
        }
    } else if (val instanceof Array) {
        for (let idx = 0; idx < val.length; idx++) {
            const el = val[idx];

            if (!(el instanceof ASTNode)) {
                throw new Error(
                    `Expected property ${prop}[${idx}] of ${pp(node)} to be an ASTNode not ${el}`
                );
            }

            if (!inCtx(val, ctx)) {
                throw new Error(
                    `Node ${pp(node)} property ${prop}[${idx}] ${pp(
                        el
                    )} not in expected context ${pp(ctx)}. Instead in ${pp(el.context)}`
                );
            }
        }
    } else {
        throw new Error(`Expected property ${prop} of ${pp(node)} to be an ASTNode, not ${val}`);
    }
}

/**
 * Helper to check that:
 *
 * 1) the field `field` of `node` is either a number or array of numbers
 * 2) the field `vField` of `node` is either an `ASTNode` or an array of ASTNodes
 * 3) if field is a number then `vField` is an `ASTNode` and `field == vField.id`
 * 4) if field is an array of numbers then `vField` is an `ASTNode[]` and
 *      `node.field.length === node.vField.length` and `node.field[i] ===
 *      node.vField[i].id` forall i in `[0, ... node.field.lenth)`
 *
 */
function checkFieldAndVFieldMatch<T extends ASTNode, K1 extends keyof T, K2 extends keyof T>(
    node: T,
    field: K1,
    vField: K2
): void {
    const val1 = node[field];
    const val2 = node[vField];

    if (typeof val1 === "number") {
        if (!(val2 instanceof ASTNode)) {
            throw new Error(
                `Expected property ${vField} of ${pp(
                    node
                )} to be an ASTNode when ${field} is a number, not ${val2}`
            );
        }

        if (val1 != val2.id) {
            throw new InsaneASTError(
                `Node ${pp(node)} property ${field} ${val1} differs from ${vField}.id ${pp(val2)}`
            );
        }
    } else if (val1 instanceof Array) {
        if (!(val2 instanceof Array)) {
            throw new Error(
                `Expected property ${vField} of ${pp(
                    node
                )} to be an array when ${vField} is an array, not ${val2}`
            );
        }

        if (val1.length !== val2.length) {
            throw new InsaneASTError(
                `Node ${pp(node)} array properties ${field} and ${vField} have different lengths ${
                    val1.length
                } != ${val2.length}`
            );
        }

        for (let idx = 0; idx < val1.length; idx++) {
            const el1 = val1[idx];
            const el2 = val2[idx];

            if (typeof el1 !== "number") {
                throw new Error(
                    `Expected property ${field}[${idx}] of ${pp(node)} to be a number not ${el1}`
                );
            }

            if (!(el2 instanceof ASTNode)) {
                throw new Error(
                    `Expected property ${vField}[${idx}] of ${pp(node)} to be a number not ${el2}`
                );
            }

            if (el1 != el2.id) {
                throw new InsaneASTError(
                    `Node ${pp(
                        node
                    )} property ${field}[${idx}] ${el1} differs from ${vField}[${idx}].id ${pp(
                        el2
                    )}`
                );
            }
        }
    } else {
        throw new Error(
            `Expected property ${field} of ${pp(
                node
            )} to be a number or  array of numbers not ${val1}`
        );
    }
}

/**
 * Helper to check that:
 *
 * 1. All ASTNodes that appear in each of the `fields` of `node` is a direct child of `node`
 * 2. All the direct children of `node` are mentioned in some of the `fields`.
 */
function checkDirectChildren<T extends ASTNode>(node: T, ...fields: Array<keyof T>): void {
    const directChildren = new Set(node.children);

    const computedChildren: Set<ASTNode> = new Set();

    for (const field of fields) {
        const val = node[field];
        if (val === undefined) {
            continue;
        }

        if (val instanceof ASTNode) {
            if (!directChildren.has(val)) {
                throw new InsaneASTError(
                    `Field ${field} of node ${pp(node)} is not a direct child: ${pp(
                        val
                    )} child of ${pp(val.parent)}`
                );
            }
            computedChildren.add(val);
        } else if (val instanceof Array) {
            for (let i = 0; i < val.length; i++) {
                const el = val[i];

                if (el === null) {
                    continue;
                }
                if (!(el instanceof ASTNode)) {
                    throw new Error(
                        `Field ${field} of ${pp(
                            node
                        )} is neither an ASTNode nor an array of ASTNode or nulls - instead array containing ${el}`
                    );
                }

                if (!directChildren.has(el)) {
                    throw new InsaneASTError(
                        `Field ${field}[${i}] of node ${pp(node)} is not a direct child: ${pp(
                            el
                        )} child of ${pp(el.parent)}`
                    );
                }

                computedChildren.add(el);
            }
        } else {
            throw new Error(
                `Field ${field} of ${pp(
                    node
                )} is neither an ASTNode nor an array of ASTNode or nulls: ${val}`
            );
        }
    }

    if (computedChildren.size < directChildren.size) {
        let missingChild: ASTNode | undefined;
        for (const child of directChildren) {
            if (computedChildren.has(child)) {
                continue;
            }

            missingChild = child;
            break;
        }

        throw new InsaneASTError(
            `Fields ${fields.join(", ")} don't completely cover the direct children: ${pp(
                missingChild
            )} is missing`
        );
    }
}

/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *
 *  - all reachable nodes belong to the same context, have their parent/sibling set correctly,
 *  - all number id properties of nodes point to a node in the same context
 *  - when a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number proerty corresponds to the id of the `v` prefixed property.
 *  - most 'v' properties point to direct children of a node
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 *
 * @param unit - source unit to check
 * @param ctxts - `ASTContext`s for each of the groups of units
 */
export function checkSane(unit: SourceUnit, ctx: ASTContext): void {
    for (const child of unit.getChildren(true)) {
        if (!inCtx(child, ctx)) {
            throw new InsaneASTError(
                `Child ${pp(child)} in different context: ${ctx.id} from expected ${ctx.id}`
            );
        }

        const immediateChildren = child.children;

        // Each direct child has us as the parent
        for (let i = 0; i < immediateChildren.length; i++) {
            const subChild = immediateChildren[i];

            if (subChild.parent !== child) {
                //`Node ${subChild.print()} has wrong parent.`
                throw new InsaneASTError(
                    `Child ${pp(subChild)} has wrong parent: expected ${pp(child)} got ${pp(
                        subChild.parent
                    )}`
                );
            }
        }

        // Node specific checks
        /// ======== META NODES ==========================================
        if (child instanceof SourceUnit) {
            // Fix `exportedSymbols' and 'vExportedSymbols'
            for (const [name, symId] of child.exportedSymbols) {
                const symNode = ctx.locate(symId);

                if (symNode === undefined) {
                    throw new InsaneASTError(
                        `Exported symbol ${name} ${symId} missing from context ${ctx.id}`
                    );
                }

                if (symNode !== child.vExportedSymbols.get(name)) {
                    throw new InsaneASTError(
                        `Exported symbol ${name} for id ${symId} (${pp(
                            symNode
                        )}) doesn't match vExportedSymbols entry: ${pp(
                            child.vExportedSymbols.get(name)
                        )}`
                    );
                }
            }

            checkDirectChildren(
                child,
                "vPragmaDirectives",
                "vImportDirectives",
                "vContracts",
                "vEnums",
                "vStructs",
                "vFunctions",
                "vVariables"
            );
        } else if (child instanceof ImportDirective) {
            // Unfortunately due to compiler bugs in older compilers, when child.symbolAliases[i].foreign is a number
            // its invalid. When its an Identifier, only its name is valid.
            if (
                child.vSymbolAliases.length !== 0 &&
                child.vSymbolAliases.length !== child.symbolAliases.length
            ) {
                throw new InsaneASTError(
                    `symbolAliases.length (${
                        child.symbolAliases.length
                    }) and vSymboliAliases.length ${
                        child.vSymbolAliases.length
                    } misamtch for import ${pp(child)}`
                );
            }

            for (let i = 0; i < child.vSymbolAliases.length; i++) {
                const def = child.vSymbolAliases[i][0];

                if (!inCtx(def, ctx)) {
                    throw new InsaneASTError(
                        `Imported symbol ${pp(def)} from import ${pp(
                            child
                        )} not in expected context ${pp(ctx)}`
                    );
                }
            }

            // 'scope' and 'vScope'
            checkFieldAndVFieldMatch(child, "scope", "vScope");
            checkVFieldCtx(child, "vScope", ctx);

            // 'sourceUnit' and 'vSourceUnit'
            checkFieldAndVFieldMatch(child, "sourceUnit", "vSourceUnit");
            checkVFieldCtx(child, "vSourceUnit", ctx);
        } else if (child instanceof InheritanceSpecifier) {
            // Nothing to do
            checkDirectChildren(child, "vBaseType", "vArguments");
        } else if (child instanceof ModifierInvocation) {
            checkVFieldCtx(child, "vModifier", ctx);
            checkDirectChildren(child, "vModifierName", "vArguments");
        } else if (child instanceof OverrideSpecifier) {
            // Nothing to do
            checkDirectChildren(child, "vOverrides");
        } else if (child instanceof ParameterList) {
            checkVFieldCtx(child, "vParameters", ctx);
            checkDirectChildren(child, "vParameters");
        } else if (child instanceof PragmaDirective || child instanceof StructuredDocumentation) {
            // Nothing to do
        } else if (child instanceof UsingForDirective) {
            // Nothing to do
            checkDirectChildren(child, "vLibraryName", "vTypeName");
        } else if (child instanceof ContractDefinition) {
            /// ======== DECLARATION NODES ==========================================
            // 'scope' and 'vScope'
            checkFieldAndVFieldMatch(child, "scope", "vScope");
            checkVFieldCtx(child, "vScope", ctx);

            if (child.vScope !== child.parent) {
                throw new InsaneASTError(
                    `Contract ${pp(child)} vScope ${pp(child.vScope)} and parent ${pp(
                        child.parent
                    )} differ`
                );
            }

            // linearizedBaseContracts and vLinearizedBaseContracts
            checkFieldAndVFieldMatch(child, `linearizedBaseContracts`, `vLinearizedBaseContracts`);

            checkVFieldCtx(child, `vLinearizedBaseContracts`, ctx);

            // documentation
            if (child.documentation instanceof StructuredDocumentation) {
                checkVFieldCtx(child, "documentation", ctx);
            }

            checkDirectChildren(
                child,
                "vInheritanceSpecifiers",
                "vStateVariables",
                "vModifiers",
                "vEvents",
                "vFunctions",
                "vUsingForDirectives",
                "vStructs",
                "vEnums",
                "vConstructor"
            );
        } else if (child instanceof EnumDefinition) {
            checkVFieldCtx(child, "vScope", ctx);

            checkDirectChildren(child, "vMembers");
        } else if (child instanceof EnumValue) {
            // Nothing to do
        } else if (child instanceof EventDefinition) {
            if (child.documentation instanceof StructuredDocumentation) {
                checkVFieldCtx(child, "documentation", ctx);
            }

            checkVFieldCtx(child, "vScope", ctx);
            checkDirectChildren(child, "vParameters");
        } else if (child instanceof FunctionDefinition) {
            // scope and vScope
            checkFieldAndVFieldMatch(child, "scope", "vScope");
            checkVFieldCtx(child, "vScope", ctx);

            if (child.documentation instanceof StructuredDocumentation) {
                checkVFieldCtx(child, "documentation", ctx);
            }
            checkDirectChildren(
                child,
                "vParameters",
                "vOverrideSpecifier",
                "vModifiers",
                "vReturnParameters",
                "vBody"
            );
        } else if (child instanceof ModifierDefinition) {
            if (child.documentation instanceof StructuredDocumentation) {
                checkVFieldCtx(child, "documentation", ctx);
            }

            checkVFieldCtx(child, "vScope", ctx);
            checkDirectChildren(child, "vParameters", "vOverrideSpecifier", "vBody");
        } else if (child instanceof StructDefinition) {
            // scope and vScope
            checkFieldAndVFieldMatch(child, "scope", "vScope");
            checkVFieldCtx(child, "vScope", ctx);
            checkDirectChildren(child, "vMembers");
        } else if (child instanceof VariableDeclaration) {
            // scope and vScope
            checkFieldAndVFieldMatch(child, "scope", "vScope");
            checkVFieldCtx(child, "vScope", ctx);

            if (child.documentation instanceof StructuredDocumentation) {
                checkVFieldCtx(child, "documentation", ctx);
            }

            checkDirectChildren(child, "vType", "vOverrideSpecifier", "vValue");
        } else if (child instanceof Block || child instanceof UncheckedBlock) {
            /// ======== STATEMENT NODES ==========================================
            // Nothing to do
            checkDirectChildren(child, "vStatements");
        } else if (child instanceof Break || child instanceof Continue) {
            // Nothing to do
        } else if (child instanceof DoWhileStatement) {
            // Nothing to do
            checkDirectChildren(child, "vCondition", "vBody");
        } else if (child instanceof EmitStatement) {
            checkDirectChildren(child, "vEventCall");
        } else if (child instanceof ExpressionStatement) {
            checkDirectChildren(child, "vExpression");
        } else if (child instanceof ForStatement) {
            checkDirectChildren(
                child,
                "vInitializationExpression",
                "vLoopExpression",
                "vCondition",
                "vBody"
            );
        } else if (child instanceof IfStatement) {
            checkVFieldCtx(child, "vCondition", ctx);
            checkVFieldCtx(child, "vTrueBody", ctx);

            if (child.vFalseBody !== undefined) {
                checkVFieldCtx(child, "vFalseBody", ctx);
            }

            checkDirectChildren(child, "vCondition", "vTrueBody", "vFalseBody");
        } else if (child instanceof InlineAssembly) {
            // Nothing to do
        } else if (child instanceof PlaceholderStatement) {
            // Nothing to do
        } else if (child instanceof Return) {
            // functionReturnParameters and vFunctionReturnParameters
            checkFieldAndVFieldMatch(
                child,
                "functionReturnParameters",
                "vFunctionReturnParameters"
            );

            checkVFieldCtx(child, "vFunctionReturnParameters", ctx);
            checkDirectChildren(child, "vExpression");
        } else if (child instanceof Throw) {
            // Nothing to do
        } else if (child instanceof TryCatchClause) {
            // Nothing to do
            checkDirectChildren(child, "vParameters", "vBlock");
        } else if (child instanceof TryStatement) {
            // Nothing to do
            checkDirectChildren(child, "vExternalCall", "vClauses");
        } else if (child instanceof VariableDeclarationStatement) {
            // Nothing to do
            checkDirectChildren(child, "vDeclarations", "vInitialValue");
        } else if (child instanceof WhileStatement) {
            // Nothing to do
            checkDirectChildren(child, "vCondition", "vBody");
        } else if (child instanceof ArrayTypeName) {
            /// ======== TYPE NODES ==========================================
            // Nothing to do
            checkDirectChildren(child, "vBaseType", "vLength");
        } else if (child instanceof ElementaryTypeName) {
            // nothing to do
        } else if (child instanceof FunctionTypeName) {
            // Nothing to do
            checkDirectChildren(child, "vParameterTypes", "vReturnParameterTypes");
        } else if (child instanceof Mapping) {
            // Nothing to do
            checkDirectChildren(child, "vKeyType", "vValueType");
        } else if (child instanceof UserDefinedTypeName) {
            checkFieldAndVFieldMatch(child, "referencedDeclaration", "vReferencedDeclaration");
            checkVFieldCtx(child, "vReferencedDeclaration", ctx);
            checkDirectChildren(child, "path");
        } else if (child instanceof Assignment) {
            /// ======== EXPRESION NODES ==========================================
            // Nothing to do
            checkDirectChildren(child, "vLeftHandSide", "vRightHandSide");
        } else if (child instanceof BinaryOperation) {
            // Nothing to do
            checkDirectChildren(child, "vLeftExpression", "vRightExpression");
        } else if (child instanceof Conditional) {
            // Nothing to do
            checkDirectChildren(child, "vCondition", "vTrueExpression", "vFalseExpression");
        } else if (child instanceof ElementaryTypeNameExpression) {
            // Nothing to do
            if (!(typeof child.typeName === "string")) {
                checkDirectChildren(child, "typeName");
            }
        } else if (child instanceof FunctionCall) {
            // Nothing to do
            checkDirectChildren(child, "vExpression", "vArguments");
        } else if (child instanceof FunctionCallOptions) {
            // Nothing to do
            checkDirectChildren(child, "vExpression", "vOptions");
        } else if (child instanceof Identifier || child instanceof IdentifierPath) {
            if (
                child.referencedDeclaration !== null &&
                child.vReferencedDeclaration !== undefined
            ) {
                checkFieldAndVFieldMatch(child, "referencedDeclaration", "vReferencedDeclaration");
                checkVFieldCtx(child, "vReferencedDeclaration", ctx);
            }
        } else if (child instanceof IndexAccess) {
            // Nothing to do
            checkDirectChildren(child, "vBaseExpression", "vIndexExpression");
        } else if (child instanceof IndexRangeAccess) {
            // Nothing to do
            checkDirectChildren(child, "vBaseExpression", "vStartExpression", "vEndExpression");
        } else if (child instanceof Literal) {
            // Nothing to do
        } else if (child instanceof MemberAccess) {
            if (
                child.referencedDeclaration !== null &&
                child.vReferencedDeclaration !== undefined
            ) {
                checkFieldAndVFieldMatch(child, "referencedDeclaration", "vReferencedDeclaration");
                checkVFieldCtx(child, "vReferencedDeclaration", ctx);
            }
            checkDirectChildren(child, "vExpression");
        } else if (child instanceof NewExpression) {
            // Nothing to do
            checkDirectChildren(child, "vTypeName");
        } else if (child instanceof TupleExpression) {
            // Nothing to do
            checkDirectChildren(child, "vOriginalComponents", "vComponents");
        } else if (child instanceof UnaryOperation) {
            checkVFieldCtx(child, "vSubExpression", ctx);
            checkDirectChildren(child, "vSubExpression");
        } else {
            throw new Error(`Unknown ASTNode type ${child.constructor.name}`);
        }
    }
}

/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *
 *  - all reachable nodes belong to the same context, have their parent/sibling set correctly,
 *  - all number id properties of nodes point to a node in the same context
 *  - when a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number proerty corresponds to the id of the `v` prefixed property.
 *  - most 'v' properties point to direct children of a node
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 *
 * @param unit - source unit to check
 * @param ctxts - `ASTContext`s for each of the groups of units
 */
export function isSane(unit: SourceUnit, ctx: ASTContext): boolean {
    try {
        checkSane(unit, ctx);
    } catch (e) {
        if (e instanceof InsaneASTError) {
            console.error(e);
            return false;
        }

        throw e;
    }

    return true;
}
