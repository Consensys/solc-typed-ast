import {
    ArrayTypeName,
    ContractDefinition,
    DataLocation,
    ElementaryTypeName,
    EnumDefinition,
    FunctionTypeName,
    Literal,
    LiteralKind,
    Mapping,
    StructDefinition,
    TypeName,
    UserDefinedTypeName,
    VariableDeclaration
} from "../ast";
import { assert } from "../misc";
import {
    AddressType,
    ArrayType,
    BoolType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntType,
    MappingType,
    PackedArrayType,
    PointerType,
    StringType,
    TupleType,
    TypeNode,
    UserDefinedType
} from "./ast";

/**
 * Given a general type 'pattern' that doesn't contain any data locations, and a data location,
 * produce a concrete instance of the general type for the target location.
 * This is the inverse of `specializeType()`
 *
 * Note that this has to recursively fix sub-parts of compount types such as arrays and maps.
 * Note that this doesn't handle all possible expression types - just the ones that that may appear
 * in a variable declaration.
 *
 * @param type - general type "pattern"
 * @param loc - target location to specialize to
 * @returns specialized type
 */
export function specializeType(type: TypeNode, loc: DataLocation): TypeNode {
    assert(
        !(type instanceof PointerType),
        `Unexpected pointer type ${type.pp()} in concretization.`
    );

    assert(!(type instanceof TupleType), `Unexpected tuple type ${type.pp()} in concretization.`);

    // bytes and string
    if (type instanceof PackedArrayType) {
        return new PointerType(type, loc);
    }

    if (type instanceof ArrayType) {
        const concreteElT = specializeType(type.elementT, loc);

        return new PointerType(new ArrayType(concreteElT, type.size), loc);
    }

    if (type instanceof UserDefinedType) {
        const def = type.definition;

        assert(
            def !== undefined,
            `Can't concretize user defined type ${type.pp()} with no corresponding definition.`
        );

        if (def instanceof StructDefinition) {
            // Contracts are always concretized as storage poitners
            return new PointerType(type, loc);
        }

        // Enums are a value type
        return type;
    }

    if (type instanceof MappingType) {
        // Always treat map keys as in-memory copies
        const concreteKeyT = specializeType(type.keyType, DataLocation.Memory);
        // The result of map indexing is always a pointer to a value that lives in storage
        const concreteValueT = specializeType(type.valueType, DataLocation.Storage);
        // Maps always live in storage
        return new PointerType(new MappingType(concreteKeyT, concreteValueT), DataLocation.Storage);
    }

    // TODO: What to do about string literals?
    // All other types are "value" types.
    return type;
}

/**
 * Given a `TypeNode` `type` that is specialized to some storage location, compute the original 'general' type that is
 * independent of location. This is the inverse of `specializeType()`
 *
 * Note that this doesn't handle all possible expression types - just the ones that that may appear
 * in a variable declaration.
 *
 * @param type - specialized type
 * @returns computed generalized type.
 */
export function generalizeType(type: TypeNode): [TypeNode, DataLocation | undefined] {
    if (type instanceof PointerType) {
        const [generalizedTo] = generalizeType(type.to);

        return [generalizedTo, type.location];
    }

    if (type instanceof ArrayType) {
        const [innerT] = generalizeType(type.elementT);

        return [new ArrayType(innerT, type.size), undefined];
    }

    if (type instanceof MappingType) {
        const [genearlKeyT] = generalizeType(type.keyType);
        const [generalValueT] = generalizeType(type.valueType);

        return [new MappingType(genearlKeyT, generalValueT), DataLocation.Storage];
    }

    // The only other types that contains sub-types are the FunctionType and TypeNameType. However those don't
    // get specialized/generalized w.r.t. storage locations.

    return [type, undefined];
}

function getUserDefinedTypeFQName(
    def: ContractDefinition | StructDefinition | EnumDefinition
): string {
    return def.vScope instanceof ContractDefinition ? `${def.vScope.name}.${def.name}` : def.name;
}

/**
 * Given a `VariableDeclaration` node `decl` compute the `TypeNode` that corresponds to the variable. This takes into account
 * the storage location of the `decl`.
 */
export function variableDeclarationToTypeNode(decl: VariableDeclaration): TypeNode {
    assert(decl.vType !== undefined, `Decl ${decl.id} is missing type`);

    const rawTypeNode = typeNameToTypeNode(decl.vType);

    return specializeType(rawTypeNode, decl.storageLocation);
}

/**
 * Convert a given ast `TypeName` into a `TypeNode`. This produces "general
 * type patterns" without any specific storage information.
 *
 * @param astT - original AST `TypeName`
 * @returns equivalent `TypeNode`.
 */
export function typeNameToTypeNode(astT: TypeName): TypeNode {
    if (astT instanceof ElementaryTypeName) {
        const name = astT.name.trim();

        if (name === "bool") {
            return new BoolType();
        }

        const addressRE = /^address *(payable)?$/;

        let m = name.match(addressRE);

        if (m !== null) {
            return new AddressType(astT.stateMutability === "payable");
        }

        const intTypeRE = /^(u?)int([0-9]*)$/;

        m = name.match(intTypeRE);

        if (m !== null) {
            const signed = m[1] !== "u";
            const nBits = m[2] === "" ? 256 : parseInt(m[2]);

            return new IntType(nBits, signed);
        }

        const bytesRE = /^bytes([0-9]+)$/;

        m = name.match(bytesRE);

        if (name == "byte" || m !== null) {
            const size = m !== null ? parseInt(m[1]) : 1;

            return new FixedBytesType(size);
        }

        if (name === "bytes" || name === "string") {
            return name === "bytes" ? new BytesType() : new StringType();
        }

        throw new Error(`NYI converting elementary AST Type ${name}`);
    }

    if (astT instanceof ArrayTypeName) {
        const elT = typeNameToTypeNode(astT.vBaseType);

        let size: bigint | undefined;

        if (astT.vLength !== undefined) {
            if (!(astT.vLength instanceof Literal && astT.vLength.kind == LiteralKind.Number)) {
                throw new Error(`NYI non-literal array type sizes`);
            }

            size = BigInt(astT.vLength.value);
        }

        return new ArrayType(elT, size);
    }

    if (astT instanceof UserDefinedTypeName) {
        const def = astT.vReferencedDeclaration;

        if (
            def instanceof StructDefinition ||
            def instanceof EnumDefinition ||
            def instanceof ContractDefinition
        ) {
            return new UserDefinedType(getUserDefinedTypeFQName(def), def);
        }

        throw new Error(`NYI typecheckin of user-defined type ${def.print()}`);
    }

    if (astT instanceof FunctionTypeName) {
        // param.vType is always defined here. Even in 0.4.x can't have function declarations with `var` args
        const parameters = astT.vParameterTypes.vParameters.map((param) =>
            variableDeclarationToTypeNode(param)
        );

        const returns = astT.vReturnParameterTypes.vParameters.map((param) =>
            variableDeclarationToTypeNode(param)
        );

        return new FunctionType(
            undefined,
            parameters,
            returns,
            astT.visibility,
            astT.stateMutability
        );
    }

    if (astT instanceof Mapping) {
        const keyT = typeNameToTypeNode(astT.vKeyType);
        const valueT = typeNameToTypeNode(astT.vValueType);

        return new MappingType(keyT, valueT);
    }

    throw new Error(`NYI converting AST Type ${astT.print()} to SType`);
}
