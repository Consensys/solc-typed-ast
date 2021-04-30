// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
// @ts-nocheck
import {
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

export function getNodeType(node: Expression | VariableDeclaration, version: string): TypeNode {
    return parse(node.typeString, { ctx: node, version }) as TypeNode;
}

function makeUserDefinedType<T extends ASNode>(
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
