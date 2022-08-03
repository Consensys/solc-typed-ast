// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
// @ts-nocheck
import {
    ASTNode,
    ASTNodeConstructor,
    ContractDefinition,
    DataLocation,
    EnumDefinition,
    Expression,
    FunctionStateMutability,
    FunctionVisibility,
    resolveAny,
    StructDefinition,
    UserDefinedValueTypeDefinition,
    VariableDeclaration
} from "../../ast";
import {
    AddressType,
    ArrayType,
    BoolType,
    BuiltinType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntLiteralType,
    IntType,
    MappingType,
    ModuleType,
    PointerType,
    RationalLiteralType,
    StringLiteralType,
    StringType,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "../ast";

function getFunctionAttributes(
    decorators: string[]
): [FunctionVisibility, FunctionStateMutability] {
    let visiblity: FunctionVisibility | undefined;
    let mutability: FunctionStateMutability | undefined;

    const visiblities = new Set<string>([
        FunctionVisibility.Internal,
        FunctionVisibility.External
    ]);

    const mutabilities = new Set<string>([
        FunctionStateMutability.Pure,
        FunctionStateMutability.View,
        FunctionStateMutability.NonPayable,
        FunctionStateMutability.Payable
    ]);

    for (const decorator of decorators) {
        if (visiblities.has(decorator)) {
            if (visiblity !== undefined) {
                throw new Error(
                    `Multiple visiblity decorators specified: ${decorator} conflicts with ${visiblity}`
                );
            }

            visiblity = decorator as FunctionVisibility;
        } else if (mutabilities.has(decorator)) {
            if (mutability !== undefined) {
                throw new Error(
                    `Multiple mutability decorators specified: ${decorator} conflicts with ${mutability}`
                );
            }

            mutability = decorator as FunctionStateMutability;
        }
    }

    // Assume default visiblity is internal
    if (visiblity === undefined) {
        visiblity = FunctionVisibility.Internal;
    }

    // Assume default mutability is non-payable
    if (mutability === undefined) {
        mutability = FunctionStateMutability.NonPayable;
    }

    return [visiblity, mutability];
}

/**
 * Return the `TypeNode` corresponding to `node`, where `node` is an AST node
 * with a type string (`Expression` or `VariableDeclaration`).
 *
 * The function uses a parser to process the type string,
 * while resolving and user-defined type references in the context of `node`.
 * 
 * @param arg - an AST node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed between 0.4.x and 0.5.x.
 */
export function getNodeType(node: Expression | VariableDeclaration, version: string): TypeNode {
    return parse(node.typeString, { ctx: node, version }) as TypeNode;
}

/**
 * Return the `TypeNode` corresponding to `arg`, where `arg` is either a raw type string,
 * or an AST node with a type string (`Expression` or `VariableDeclaration`).
 *
 * The function uses a parser to process the type string,
 * while resolving and user-defined type references in the context of `ctx`.
 * 
 * @param arg - either a type string, or a node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed between 0.4.x and 0.5.x.
 * @param ctx - `ASTNode` representing the context in which a type string is to be parsed
 */
export function getNodeTypeInCtx(arg: Expression | VariableDeclaration | string, version: string, ctx: ASTNode): TypeNode {
    const typeString = typeof arg === "string" ? arg : arg.typeString;

    return parse(typeString, { ctx, version }) as TypeNode;
}

function makeUserDefinedType<T extends ASTNode>(
    name: string,
    constructor: ASTNodeConstructor<T>,
    version: string,
    ctx: ASTNode
): UserDefinedType {
    const defs = [...resolveAny(name, ctx, version)];

    if (defs.length === 0) {
        throw new Error(`Couldn't find ${constructor.name} ${name}`);
    }

    if (defs.length > 1) {
        throw new Error(`Multiple matches for ${constructor.name} ${name}`);
    }

    const def = defs[0];

    if (!(def instanceof constructor)) {
        throw new Error(
            `Expected ${name} to resolve to ${constructor.name} got ${def.constructor.name} instead`
        );
    }

    return new UserDefinedType(name, def);
}

function wrapContract(typ: TypeNode | null): TypeNode | null {
    return typ instanceof UserDefinedType && typ.definition instanceof ContractDefinition ? new PointerType(typ, DataLocation.Storage, "pointer") : typ;
}