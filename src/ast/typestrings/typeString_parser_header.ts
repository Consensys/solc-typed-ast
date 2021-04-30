// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
// @ts-nocheck
import { StringLiteralTypeName, IntLiteralTypeName, TypeNameTypeName, BuiltinStructTypeName, ReferenceTypeName } from "../implementation/type/internal"
import { ContractDefinition, StructDefinition, EnumDefinition } from "../implementation/declaration"
import { ElementaryTypeName, TypeName, UserDefinedTypeName } from "../implementation/type"
import { DataLocation, FunctionVisibility, FunctionStateMutability, LiteralKind } from "..";
import { ASTNodeFactory } from "../ast_node_factory";
import { VariableDeclaration } from "../implementation/declaration";
import { Expression } from "../implementation/expression";
import { parse } from "semver";
import { ASTNode, ASTNodeConstructor } from "../ast_node";
import { resolveAny } from "../definitions";
import { ParameterList } from "../implementation/meta";
import { Mutability, StateVariableVisibility } from "../constants";

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

function makeUserDefinedType<T extends ASNode>(
    name: string,
    typeString: string,
    version: string,
    construtor: ASTNodeConstructor<T>, 
    factory: ASTNodeFactory,
    ctx: ASTNode
): UserDefinedTypeName {
    const defs = [...resolveAny(name, ctx, version)];
    if (defs.length === 0) {
        throw new Error(`Couldn't find ${constructor.name} ${name}`)
    }

    if (defs.length > 1) {
        throw new Error(`Multiple matches for ${constructor.name} ${name}`)
    }

    const def = defs[0];

    if (!(def instanceof construtor)) {
        throw new Error(`Expected ${name} to resolve to ${constructor.name} got ${def.constructor.name} instead`)
    }

    return factory.makeUserDefinedTypeName(typeString, name, def.id)
}

export function getNodeType(node: Expression | VariableDeclaration, factory: ASTNodeFactory, version: string) {
    return parse(node.typeString, {factory, ctx: node, version})
}

export function makeParameterList(types: TypeName[], factory: ASTNodeFactory): ParameterList {
    const decls: VariableDeclaration[] = [];
    for (const typ of types) {
        const loc = typ instanceof ReferenceTypeName ? typ.location : DataLocation.Default;
        decls.push(factory.makeVariableDeclaration(
            false,
            false,
            "",
            -1,
            false,
            loc,
            StateVariableVisibility.Default,
            Mutability.Mutable,
            typ.typeString,
            undefined,
            typ
        ))
    }

    return factory.makeParameterList(decls)
}