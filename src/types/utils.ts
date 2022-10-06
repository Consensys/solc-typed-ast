import Decimal from "decimal.js";
import { lt, satisfies } from "semver";
import {
    ArrayTypeName,
    ContractDefinition,
    DataLocation,
    ElementaryTypeName,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionTypeName,
    FunctionVisibility,
    Mapping,
    ModifierDefinition,
    ParameterList,
    PragmaDirective,
    SourceUnit,
    StructDefinition,
    TypeName,
    UserDefinedTypeName,
    UserDefinedValueTypeDefinition,
    VariableDeclaration,
    VariableDeclarationStatement
} from "../ast";
import { assert, eq, forAll, pp } from "../misc";
import { ABIEncoderVersion, ABIEncoderVersions } from "./abi";
import {
    AddressType,
    ArrayType,
    BoolType,
    BytesType,
    FixedBytesType,
    FunctionType,
    IntLiteralType,
    IntType,
    MappingType,
    PackedArrayType,
    PointerType,
    Rational,
    StringLiteralType,
    StringType,
    TupleType,
    TypeNameType,
    TypeNode,
    UserDefinedType,
    UserDefinition
} from "./ast";
import { VersionDependentType } from "./builtins";
import { evalConstantExpr } from "./eval_const";
import { types } from "../types/reserved";

export function getTypeForCompilerVersion(
    typing: VersionDependentType,
    compilerVersion: string
): TypeNode | undefined {
    const [type, version] = typing;

    return satisfies(compilerVersion, version) ? type : undefined;
}

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
    assert(!(type instanceof PointerType), "Unexpected pointer type {0} in concretization.", type);
    assert(!(type instanceof TupleType), "Unexpected tuple type {0} in concretization.", type);

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
            "Can't concretize user defined type {0} with no corresponding definition.",
            type
        );

        if (def instanceof StructDefinition) {
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
 * Given a `TypeNode` `type` that is specialized to some storage location,
 * compute the original 'general' type that is independent of location.
 * This is the inverse of `specializeType()`
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

    if (type instanceof FunctionType) {
        return [
            new FunctionType(
                type.name,
                type.parameters.map((paramT) => generalizeType(paramT)[0]),
                type.returns.map((retT) => generalizeType(retT)[0]),
                type.visibility,
                type.mutability,
                type.implicitFirstArg
            ),
            undefined
        ];
    }

    if (type instanceof TypeNameType) {
        return generalizeType(type.type);
    }

    if (type instanceof TupleType) {
        return [new TupleType(type.elements.map((elT) => generalizeType(elT)[0])), undefined];
    }

    return [type, undefined];
}

export type NamedDefinition =
    | UserDefinition
    | FunctionDefinition
    | ErrorDefinition
    | EventDefinition
    | VariableDeclaration
    | ModifierDefinition;

export function getFQDefName(def: NamedDefinition): string {
    return def.vScope instanceof ContractDefinition ? `${def.vScope.name}.${def.name}` : def.name;
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

        const rxAddress = /^address *(payable)?$/;

        if (rxAddress.test(name)) {
            return new AddressType(astT.stateMutability === "payable");
        }

        const rxInt = /^(u?)int([0-9]*)$/;

        let m = name.match(rxInt);

        if (m !== null) {
            const signed = m[1] !== "u";
            const nBits = m[2] === "" ? 256 : parseInt(m[2]);

            return new IntType(nBits, signed);
        }

        const rxFixedBytes = /^bytes([0-9]+)$/;

        m = name.match(rxFixedBytes);

        if (m !== null) {
            const size = parseInt(m[1]);

            return new FixedBytesType(size);
        }

        if (name === "byte") {
            return new FixedBytesType(1);
        }

        if (name === "bytes") {
            return new BytesType();
        }

        if (name === "string") {
            return new StringType();
        }

        throw new Error(`NYI converting elementary AST Type ${name}`);
    }

    if (astT instanceof ArrayTypeName) {
        const elT = typeNameToTypeNode(astT.vBaseType);

        let size: bigint | undefined;

        if (astT.vLength) {
            const result = evalConstantExpr(astT.vLength);

            assert(typeof result === "bigint", "Expected bigint for size of an array type", astT);

            size = result;
        }

        return new ArrayType(elT, size);
    }

    if (astT instanceof UserDefinedTypeName) {
        const def = astT.vReferencedDeclaration;

        if (
            def instanceof StructDefinition ||
            def instanceof EnumDefinition ||
            def instanceof ContractDefinition ||
            def instanceof UserDefinedValueTypeDefinition
        ) {
            return new UserDefinedType(getFQDefName(def), def);
        }

        throw new Error(`NYI typechecking of user-defined type ${def.print()}`);
    }

    if (astT instanceof FunctionTypeName) {
        /**
         * `vType` is always defined here for parameters if a function type.
         * Even in 0.4.x can't have function declarations with `var` args.
         */
        const args = astT.vParameterTypes.vParameters.map(variableDeclarationToTypeNode);
        const rets = astT.vReturnParameterTypes.vParameters.map(variableDeclarationToTypeNode);

        return new FunctionType(undefined, args, rets, astT.visibility, astT.stateMutability);
    }

    if (astT instanceof Mapping) {
        const keyT = typeNameToTypeNode(astT.vKeyType);
        const valueT = typeNameToTypeNode(astT.vValueType);

        return new MappingType(keyT, valueT);
    }

    throw new Error(`NYI converting AST Type ${astT.print()} to SType`);
}

export function isReferenceType(generalT: TypeNode): boolean {
    return (
        (generalT instanceof UserDefinedType && generalT.definition instanceof StructDefinition) ||
        generalT instanceof ArrayType ||
        generalT instanceof PackedArrayType ||
        generalT instanceof MappingType
    );
}

/**
 * Computes a `TypeNode` equivalent of given `astT`,
 * specialized for location `loc` (if applicable).
 */
export function typeNameToSpecializedTypeNode(astT: TypeName, loc: DataLocation): TypeNode {
    return specializeType(typeNameToTypeNode(astT), loc);
}

/**
 * @deprecated
 */
export function inferVariableDeclLocation(decl: VariableDeclaration): DataLocation {
    if (decl.stateVariable) {
        return decl.constant ? DataLocation.Memory : DataLocation.Storage;
    }

    if (decl.storageLocation !== DataLocation.Default) {
        return decl.storageLocation;
    }

    if (decl.parent instanceof ParameterList) {
        // In 0.4.x param/return locations may be omitted. We assume calldata
        // for external and memory for the rest
        const fun = decl.parent.parent as FunctionDefinition;

        return fun.visibility === FunctionVisibility.External
            ? DataLocation.CallData
            : DataLocation.Memory;
    }

    if (decl.parent instanceof VariableDeclarationStatement) {
        // In 0.4.x local var locations may be omitted. We assume memory.
        return DataLocation.Memory;
    }

    if (decl.parent instanceof StructDefinition) {
        return DataLocation.Default;
    }

    if (decl.parent instanceof SourceUnit) {
        // Global vars don't have a location (no ref types yet)
        return DataLocation.Default;
    }

    throw new Error(`NYI variable declaration ${pp(decl)}`);
}

/**
 * Given a `VariableDeclaration` node `decl` compute the `TypeNode` that corresponds to the variable.
 * This takes into account the storage location of the `decl`.
 *
 * @deprecated Use `InferType.variableDeclarationToTypeNode()` instead.
 */
export function variableDeclarationToTypeNode(decl: VariableDeclaration): TypeNode {
    assert(decl.vType !== undefined, "Expected {0} to have type", decl);

    const loc = inferVariableDeclLocation(decl);

    return typeNameToSpecializedTypeNode(decl.vType, loc);
}

export function enumToIntType(decl: EnumDefinition): IntType {
    const length = decl.children.length;

    let size: number | undefined;

    for (let n = 8; n <= 32; n += 8) {
        if (length <= 2 ** n) {
            size = n;

            break;
        }
    }

    assert(
        size !== undefined,
        "Unable to detect enum type size - member count exceeds 2 ** 32",
        decl
    );

    return new IntType(size, false);
}

/**
 * Given a set of compiled units and their corresponding compiler version, determine the
 * correct ABIEncoder version for these units. If mulitple incompatible explicit pragmas are found,
 * throw an error.
 */
export function getABIEncoderVersion(
    units: SourceUnit[],
    compilerVersion: string
): ABIEncoderVersion {
    const explicitEncoderVersions = new Set<ABIEncoderVersion>();

    for (const unit of units) {
        for (const nd of unit.getChildrenByType(PragmaDirective)) {
            if (
                nd.vIdentifier === "experimental" &&
                nd.literals.length === 2 &&
                ABIEncoderVersions.has(nd.literals[1])
            ) {
                explicitEncoderVersions.add(nd.literals[1] as ABIEncoderVersion);
            }

            if (nd.vIdentifier === "abicoder") {
                let version: ABIEncoderVersion;
                const rawVer = nd.literals[1];

                if (rawVer === "v1") {
                    version = ABIEncoderVersion.V1;
                } else if (rawVer === "v2") {
                    version = ABIEncoderVersion.V2;
                } else {
                    throw new Error(`Unknown abicoder pragma version ${rawVer}`);
                }

                explicitEncoderVersions.add(version);
            }
        }
    }

    assert(
        explicitEncoderVersions.size < 2,
        `Multiple encoder versions found: ${[...explicitEncoderVersions].join(", ")}`
    );

    if (explicitEncoderVersions.size === 1) {
        return [...explicitEncoderVersions][0];
    }

    return lt(compilerVersion, "0.8.0") ? ABIEncoderVersion.V1 : ABIEncoderVersion.V2;
}

export function getFallbackFun(contract: ContractDefinition): FunctionDefinition | undefined {
    for (const base of contract.vLinearizedBaseContracts) {
        for (const fun of base.vFunctions) {
            if (fun.kind === FunctionKind.Fallback || fun.kind === FunctionKind.Receive) {
                return fun;
            }
        }
    }

    return undefined;
}

/**
 * Return true IFF `fromT` can be implicitly casted to `toT`
 */
export function castable(fromT: TypeNode, toT: TypeNode, compilerVersion: string): boolean {
    if (eq(fromT, toT)) {
        return true;
    }

    if (fromT instanceof PointerType && toT instanceof PointerType && eq(fromT.to, toT.to)) {
        return true;
    }

    if (fromT instanceof StringLiteralType) {
        /**
         * @todo Should we make an explicit check that string literal fits to bytes size?
         * Note that string length is not the same as count ob bytes in string due to multibyte chars.
         * Also for hex string literals we should check evenness of length
         */
        if (toT instanceof FixedBytesType) {
            return true;
        }

        if (toT instanceof PointerType && toT.to instanceof StringType) {
            return true;
        }

        if (toT instanceof PointerType && toT.to instanceof BytesType) {
            return true;
        }
    }

    if (fromT instanceof IntLiteralType) {
        if (
            toT instanceof FixedBytesType &&
            fromT.literal !== undefined &&
            fromT.literal >= 0n &&
            fromT.literal < 1n << BigInt(toT.size * 8)
        ) {
            return true;
        }

        if (toT instanceof IntType && fromT.literal !== undefined && toT.fits(fromT.literal)) {
            return true;
        }

        if (
            toT instanceof AddressType &&
            fromT.literal !== undefined &&
            types.uint160.fits(fromT.literal) &&
            lt(compilerVersion, "0.5.0")
        ) {
            return true;
        }
    }

    // We can implicitly cast from payable to address
    if (fromT instanceof AddressType && toT instanceof AddressType && !toT.payable) {
        return true;
    }

    // We can implicitly cast from a fixed bytes type to a larger fixed bytes type
    if (fromT instanceof FixedBytesType && toT instanceof FixedBytesType && toT.size > fromT.size) {
        return true;
    }

    if (fromT instanceof IntType) {
        // We can implicitly cast from a smaller to a larger int type with the same sign
        if (toT instanceof IntType && fromT.signed == toT.signed && fromT.nBits < toT.nBits) {
            return true;
        }

        /**
         * Can implicitly cast from unsigned ints <=160 bits to address
         */
        if (!fromT.signed && fromT.nBits <= 160 && toT instanceof AddressType) {
            return true;
        }
    }

    if (fromT instanceof UserDefinedType && fromT.definition instanceof ContractDefinition) {
        // We can implicitly cast from contract to non-payable address
        if (toT instanceof AddressType && !toT.payable) {
            return true;
        }

        // We can implicitly cast from contract to payable address if it has a payable recieve/fallback function
        if (toT instanceof AddressType && toT.payable) {
            const fbFun = getFallbackFun(fromT.definition);

            return fbFun !== undefined && fbFun.stateMutability === FunctionStateMutability.Payable;
        }

        // We can implicitly up-cast a contract
        if (toT instanceof UserDefinedType && toT.definition instanceof ContractDefinition) {
            return fromT.definition.isSubclassOf(toT.definition);
        }
    }

    return false;
}

const signedLimits: Array<[bigint, bigint]> = [];
const unsignedLimits: Array<[bigint, bigint]> = [];

for (let i = 1n; i <= 32n; i++) {
    unsignedLimits.push([0n, 2n ** (i * 8n) - 1n]);
    signedLimits.push([-(2n ** (i * 8n - 1n)), 2n ** (i * 8n - 1n) - 1n]);
}

/**
 * Find the smallest concrete int type that can hold the passed in `literals`.
 */
export function smallestFittingType(...literals: bigint[]): IntType | undefined {
    /// TODO: Need a test for this logic that checks the boundary conditions
    /// when the literals include the MIN/MAX for both signed and unsigned types
    const unsigned = forAll(literals, (literal) => literal >= 0n);

    const limits: Array<[bigint, bigint]> = unsigned ? unsignedLimits : signedLimits;

    for (let i = 0; i < limits.length; i++) {
        let fitsAll = true;
        for (const literal of literals) {
            if (!(limits[i][0] <= literal && literal <= limits[i][1])) {
                fitsAll = false;
                break;
            }
        }

        if (fitsAll) {
            return new IntType(8 * (i + 1), !unsigned);
        }
    }

    return undefined;
}

export function decimalToRational(d: Decimal): Rational {
    if (!d.isFinite()) {
        throw new Error(`Unexpected infinite rational ${d.toString()} in decimalToRational`);
    }

    const valStr = d.toFixed();
    const dotPos = valStr.indexOf(".");

    assert(dotPos !== -1, `Missing decimal point in {0}`, valStr);

    return {
        numerator: BigInt(valStr.replace(".", "")),
        denominator: 10n ** BigInt(valStr.length - dotPos - 1)
    };
}
