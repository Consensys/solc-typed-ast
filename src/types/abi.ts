import { AddressType, enumToIntType, PointerType, TypeNode, UserDefinedType } from ".";
import {
    ContractDefinition,
    DataLocation,
    EnumDefinition,
    StructDefinition,
    UserDefinedValueTypeDefinition
} from "..";
import { assert } from "../misc";
import {
    ArrayType,
    BoolType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntType,
    MappingType,
    StringType,
    TupleType
} from "./ast";
import {
    getUserDefinedTypeFQName,
    typeNameToTypeNode,
    variableDeclarationToTypeNode
} from "./utils";

export enum ABIEncoderVersion {
    V1 = "ABIEncoderV1",
    V2 = "ABIEncoderV2"
}

export const ABIEncoderVersions = new Set<string>([ABIEncoderVersion.V1, ABIEncoderVersion.V2]);

/**
 * Convert an internal TypeNode to the external TypeNode that would correspond to it
 * after ABI-encoding with encoder version `encoderVersion`. Follows the following rules:
 *
 * 1. Contract definitions turned to address.
 * 2. Enum definitions turned to uint of minimal fitting size.
 * 3. Any storage pointer types are converted to memory pointer types.
 * 4. Throw an error on any nested mapping types.
 *
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html
 */
export function toABIEncodedType(
    type: TypeNode,
    encoderVersion: ABIEncoderVersion,
    normalizePointers = false
): TypeNode {
    if (type instanceof MappingType) {
        throw new Error("Cannot abi-encode mapping types");
    }

    if (type instanceof ArrayType) {
        return new ArrayType(
            toABIEncodedType(type.elementT, encoderVersion, normalizePointers),
            type.size
        );
    }

    if (type instanceof PointerType) {
        const toT = toABIEncodedType(type.to, encoderVersion, normalizePointers);

        return new PointerType(toT, normalizePointers ? DataLocation.Memory : type.location);
    }

    if (type instanceof UserDefinedType) {
        if (type.definition instanceof UserDefinedValueTypeDefinition) {
            return typeNameToTypeNode(type.definition.underlyingType);
        }

        if (type.definition instanceof ContractDefinition) {
            return new AddressType(false);
        }

        if (type.definition instanceof EnumDefinition) {
            return enumToIntType(type.definition);
        }

        if (type.definition instanceof StructDefinition) {
            assert(
                encoderVersion !== ABIEncoderVersion.V1,
                "Getters of struct return type are not supported by ABI encoder v1"
            );

            const fieldTs = type.definition.vMembers.map((fieldT) =>
                variableDeclarationToTypeNode(fieldT)
            );

            return new TupleType(
                fieldTs.map((fieldT) => toABIEncodedType(fieldT, encoderVersion, normalizePointers))
            );
        }
    }

    return type;
}

/**
 * Get the canonical name for the `TypeNode` `t`, to be used in
 * function/accessor/error/event signatures
 */
export function abiTypeToCanonicalName(t: TypeNode): string {
    if (
        t instanceof IntType ||
        t instanceof FixedBytesType ||
        t instanceof BoolType ||
        t instanceof BytesType ||
        t instanceof StringType
    ) {
        return t.pp();
    }

    // Payable is ignored in canonical names
    if (t instanceof AddressType) {
        return "address";
    }

    if (t instanceof ArrayType) {
        return `${abiTypeToCanonicalName(t.elementT)}[${t.size ? t.size.toString(10) : ""}]`;
    }

    if (t instanceof TupleType) {
        return `(${t.elements.map((elementT) => abiTypeToCanonicalName(elementT)).join(",")})`;
    }

    // Locations are skipped in signature canonical names
    if (t instanceof PointerType) {
        return abiTypeToCanonicalName(t.to);
    }

    if (t instanceof FunctionType) {
        return "function";
    }

    assert(false, "Unexpected ABI Type: {0}", t);
}

/**
 * Get the canonical name for the `TypeNode` `t`, to be used in
 * function/accessor/error/event signatures of a _LIBRARY_ function.
 * Apparently library signatures follow different rules, as those are internal.
 */
export function abiTypeToLibraryCanonicalName(t: TypeNode): string {
    if (
        t instanceof IntType ||
        t instanceof FixedBytesType ||
        t instanceof BoolType ||
        t instanceof BytesType ||
        t instanceof StringType
    ) {
        return t.pp();
    }

    // Payable is ignored in canonical names
    if (t instanceof AddressType) {
        return "address";
    }

    if (t instanceof ArrayType) {
        return `${abiTypeToLibraryCanonicalName(t.elementT)}[${t.size ? t.size.toString(10) : ""}]`;
    }

    if (t instanceof TupleType) {
        return `(${t.elements
            .map((elementT) => abiTypeToLibraryCanonicalName(elementT))
            .join(",")})`;
    }

    // Locations are skipped in signature canonical names in libraries _UNLESS_ they are storage.
    // Go figure...
    if (t instanceof PointerType) {
        const toName = abiTypeToLibraryCanonicalName(t.to);

        return t.location === DataLocation.Storage ? `${toName} storage` : toName;
    }

    if (t instanceof UserDefinedType) {
        return getUserDefinedTypeFQName(t.definition);
    }

    if (t instanceof MappingType) {
        const keyName = abiTypeToLibraryCanonicalName(t.keyType);
        const valueName = abiTypeToLibraryCanonicalName(t.valueType);

        return `mapping(${keyName} => ${valueName})`;
    }

    if (t instanceof FunctionType) {
        return "function";
    }

    assert(false, "Unexpected ABI Type: {0}", t);
}
