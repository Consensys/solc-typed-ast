import {
    TypeNode,
    PointerType,
    specializeType,
    UserDefinedType,
    AddressType,
    enumToIntType
} from ".";
import { DataLocation, ContractDefinition, EnumDefinition, StructDefinition } from "..";
import { assert, forAll } from "../misc";
import { ArrayType, MappingType } from "./ast";
import { getUserDefinedTypeFQName, variableDeclarationToTypeNode } from "./utils";

export enum ABIEncoderVersion {
    V1,
    V2
}

/**
 * Helper to check if a type `t` contains a nested mapping.
 */
function containsMapping(t: TypeNode): boolean {
    if (t instanceof MappingType) {
        return true;
    }

    if (t instanceof PointerType) {
        return containsMapping(t.to);
    }

    if (t instanceof ArrayType) {
        return containsMapping(t.elementT);
    }

    if (t instanceof UserDefinedType && t.definition instanceof StructDefinition) {
        return forAll(t.definition.vMembers, (field) => {
            const fieldT = variableDeclarationToTypeNode(field);
            return !containsMapping(fieldT);
        });
    }

    return false;
}

/**
 * Convert an internal TypeNode to the external TypeNode that would correspond to it
 * after ABI-encoding with encoder version `encoderVersion`. Follows the following rules:
 *
 * 1. Contract definitions turned to address.
 * 2. Enum definitions turned to uint of minimal fitting size.
 * 3. Any storage pointer types are converted to memory pointer types.
 * 4. Throw an error on any nested mapping types
 */
export function toABIEncodedType(type: TypeNode, encoderVersion: ABIEncoderVersion): TypeNode {
    if (type instanceof MappingType) {
        throw new Error(`Cannnot abi-encode mapping types.`);
    }

    if (type instanceof PointerType) {
        const toT = toABIEncodedType(type.to, encoderVersion);

        return specializeType(toT, DataLocation.Memory);
    }

    if (type instanceof UserDefinedType) {
        if (type.definition instanceof ContractDefinition) {
            return new AddressType(false);
        }

        if (type.definition instanceof EnumDefinition) {
            return enumToIntType(type.definition);
        }

        if (type.definition instanceof StructDefinition) {
            assert(
                encoderVersion !== ABIEncoderVersion.V1,
                "Getters of struct return type are not supported by ABI encoder v1."
            );
            assert(!containsMapping(type), `Mapping types cannot be ABI encoded.`);
        }

        return new UserDefinedType(getUserDefinedTypeFQName(type.definition), type.definition);
    }

    return type;
}
