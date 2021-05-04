// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
// @ts-nocheck
import {
    ASTNode,
    ContractDefinition,
    DataLocation,
    EnumDefinition,
    Expression,
    FunctionStateMutability,
    FunctionVisibility,
    resolveAny,
    StructDefinition,
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
    StringLiteralType,
    StringType,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType
} from "../ast";

function getFunctionAttributes(
    rawDecorators: string[]
): [FunctionVisibility, FunctionStateMutability] {
    let visiblity: FunctionVisibility | undefined;
    let mutability: FunctionStateMutability | undefined;

    for (const decorator of rawDecorators) {
        if (["external", "internal"].includes(decorator)) {
            if (visiblity !== undefined) {
                throw new Error(
                    `Multiple visiblity decorators specified: ${decorator} conflicts with ${visiblity}`
                );
            }

            visiblity = decorator;
        }

        if (["pure", "view", "nonpayable", "payable"].includes(decorator)) {
            if (mutability !== undefined) {
                throw new Error(
                    `Multiple mutability decorators specified: ${decorator} conflicts with ${mutability}`
                );
            }

            mutability = decorator;
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
 * Return the `TypeNode` corresponding to `arg`, where `arg` is a node with a type string (`Expression` or `VariableDeclaration`).
 * The function uses a parser to parse the type string, while resolving and user-defined type refernces in the context of `arg`.
 * 
 * @param arg - either a type string, or a node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed betwee 0.4.x and 0.5.x
 * @returns 
 */
export function getNodeType(node: Expression | VariableDeclaration, version: string): TypeNode {
    return parse(node.typeString, { ctx: node, version }) as TypeNode;
}

/**
 * Return the `TypeNode` corresponding to `arg`, where `arg` is either a raw type string, or a node with a type string (`Expression` or `VariableDeclaration`).
 * The function uses a parser to parse the type string, while resolving and user-defined type refernces in the context of `ctx`.
 * 
 * @param arg - either a type string, or a node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed betwee 0.4.x and 0.5.x
 * @param ctx - `ASTNode` representing the context in which a type string is to be parsed
 * @returns 
 */
export function getNodeTypeInCtx(arg: Expression | VariableDeclaration | string, version: string, ctx: ASTNode): TypeNode {
    const typeString = typeof arg === 'string' ? arg : arg.typeString;
    return parse( typeString, { ctx, version }) as TypeNode;
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
