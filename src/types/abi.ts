import { DataLocation } from "..";
import { assert, forAll } from "../misc";
import {
    AddressType,
    ArrayType,
    BoolType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntType,
    MappingType,
    PointerType,
    StringType,
    TupleType,
    TypeNode,
    UserDefinedType
} from "./ast";
import { getFQDefName } from "./utils";

export enum ABIEncoderVersion {
    V1 = "ABIEncoderV1",
    V2 = "ABIEncoderV2"
}

export const ABIEncoderVersions = new Set<string>([ABIEncoderVersion.V1, ABIEncoderVersion.V2]);

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
        assert(
            forAll(t.elements, (el) => el !== null),
            "Empty tuple elements are disallowed. Got {0}",
            t
        );

        return `(${t.elements
            .map((elementT) => abiTypeToCanonicalName(elementT as TypeNode))
            .join(",")})`;
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
        assert(
            forAll(t.elements, (el) => el !== null),
            "Empty tuple elements are disallowed. Got {0}",
            t
        );

        return `(${t.elements
            .map((elementT) => abiTypeToLibraryCanonicalName(elementT as TypeNode))
            .join(",")})`;
    }

    // Locations are skipped in signature canonical names in libraries _UNLESS_ they are storage.
    // Go figure...
    if (t instanceof PointerType) {
        const toName = abiTypeToLibraryCanonicalName(t.to);

        return t.location === DataLocation.Storage ? `${toName} storage` : toName;
    }

    if (t instanceof UserDefinedType) {
        return getFQDefName(t.definition);
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
