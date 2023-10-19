import Decimal from "decimal.js";
import { gte, lt, satisfies } from "semver";
import {
    ContractDefinition,
    DataLocation,
    EnumDefinition,
    ErrorDefinition,
    EventDefinition,
    Expression,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    ModifierDefinition,
    SourceUnit,
    StructDefinition,
    TupleExpression,
    VariableDeclaration
} from "../ast";
import { assert, eq, forAll, forAny } from "../misc";
import { types } from "../types";
import { ABIEncoderVersion } from "./abi";
import {
    AddressType,
    ArrayType,
    BuiltinFunctionType,
    BytesType,
    FixedBytesType,
    FunctionLikeSetType,
    FunctionSetType,
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

export const SUBDENOMINATION_MULTIPLIERS = new Map<string, Decimal>([
    ["seconds", new Decimal(1)],
    ["minutes", new Decimal(60)],
    ["hours", new Decimal(3600)],
    ["days", new Decimal(24 * 3600)],
    ["weeks", new Decimal(7 * 24 * 3600)],
    ["years", new Decimal(365 * 24 * 3600)],
    ["wei", new Decimal(1)],
    ["gwei", new Decimal(10 ** 9)],
    ["szabo", new Decimal(10 ** 12)],
    ["finney", new Decimal(10).toPower(15)],
    ["ether", new Decimal(10).toPower(18)]
]);

export const CALL_BUILTINS = ["call", "callcode", "staticcall", "delegatecall", "transfer", "send"];

export const BINARY_OPERATOR_GROUPS = {
    Arithmetic: ["+", "-", "*", "/", "%", "**"],
    Bitwise: ["<<", ">>", "&", "|", "^"],
    Comparison: ["<", ">", "<=", ">="],
    Equality: ["==", "!="],
    Logical: ["&&", "||"]
};

export function getTypeForCompilerVersion(
    typing: TypeNode | VersionDependentType,
    compilerVersion: string
): TypeNode | undefined {
    if (typing instanceof TypeNode) {
        return typing;
    }

    const [type, version] = typing;

    return satisfies(compilerVersion, version) ? type : undefined;
}

/**
 * Given 2 function pointer's visibilities infer a common visibility thats compatible with both.
 * This is used to infer the visibility of the expression `flag ? fun1 : fun2` where fun1 and fun2 are
 * function pointers.
 */
export function inferCommonVisiblity(
    a: FunctionVisibility,
    b: FunctionVisibility
): FunctionVisibility | undefined {
    const visiblityOrder = [
        FunctionVisibility.External,
        FunctionVisibility.Public,
        FunctionVisibility.Internal,
        FunctionVisibility.Default,
        FunctionVisibility.Private
    ];

    if (a == b) {
        return a;
    }

    if (visiblityOrder.indexOf(a) > visiblityOrder.indexOf(b)) {
        [b, a] = [a, b];
    }

    if (a === FunctionVisibility.External) {
        return b == FunctionVisibility.Public ? FunctionVisibility.External : undefined;
    }

    return FunctionVisibility.Internal;
}

/**
 * Given two `FunctionType`s/`BuiltinFunctionType`s/`FunctionSetType`s `a` and `b`
 * return a `FunctionSetType` that includes everything in `a` and `b`.
 */
export function mergeFunTypes(
    a: FunctionType | BuiltinFunctionType | FunctionSetType,
    b: FunctionType | BuiltinFunctionType | FunctionSetType
): FunctionSetType {
    const funs: Array<FunctionType | BuiltinFunctionType> = [];

    if (a instanceof FunctionType || a instanceof BuiltinFunctionType) {
        funs.push(a);
    } else {
        funs.push(...a.defs);
    }

    if (b instanceof FunctionType || b instanceof BuiltinFunctionType) {
        funs.push(b);
    } else {
        funs.push(...b.defs);
    }

    return new FunctionLikeSetType(funs);
}

/**
 * Strip any singleton parens from expressions. I.e. given (((e))) returns e.
 */
export function stripSingletonParens(e: Expression): Expression {
    while (e instanceof TupleExpression && e.vOriginalComponents.length === 1) {
        const comp = e.vOriginalComponents[0];

        assert(comp !== null, 'Unexpected "null" component in tuple with single element');

        e = comp;
    }

    return e;
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

    if (type instanceof TypeNameType) {
        return generalizeType(type.type);
    }

    if (type instanceof TupleType) {
        return [
            new TupleType(
                type.elements.map((elT) => (elT === null ? null : generalizeType(elT)[0]))
            ),
            undefined
        ];
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

export function isReferenceType(generalT: TypeNode): boolean {
    return (
        (generalT instanceof UserDefinedType && generalT.definition instanceof StructDefinition) ||
        generalT instanceof ArrayType ||
        generalT instanceof PackedArrayType ||
        generalT instanceof MappingType
    );
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

export function fixedBytesTypeToIntType(type: FixedBytesType): IntType {
    return new IntType(type.size * 8, false, type.src);
}

export function getABIEncoderVersion(unit: SourceUnit, compilerVersion: string): ABIEncoderVersion {
    const predefined = unit.abiEncoderVersion;

    if (predefined) {
        return predefined;
    }

    return lt(compilerVersion, "0.8.0") ? ABIEncoderVersion.V1 : ABIEncoderVersion.V2;
}

export function getFallbackRecvFuns(contract: ContractDefinition): FunctionDefinition[] {
    const res: FunctionDefinition[] = [];

    for (const base of contract.vLinearizedBaseContracts) {
        for (const fun of base.vFunctions) {
            if (fun.kind === FunctionKind.Fallback || fun.kind === FunctionKind.Receive) {
                res.push(fun);
            }
        }
    }

    return res;
}

export function isVisiblityExternallyCallable(a: FunctionVisibility): boolean {
    return a === FunctionVisibility.External || a === FunctionVisibility.Public;
}

function functionVisibilitiesCompatible(a: FunctionVisibility, b: FunctionVisibility): boolean {
    return (
        a === b ||
        (a === FunctionVisibility.External && isVisiblityExternallyCallable(b)) ||
        (b === FunctionVisibility.External && isVisiblityExternallyCallable(a)) ||
        (a !== FunctionVisibility.External && b !== FunctionVisibility.External)
    );
}

/**
 * Return true IFF `fromT` can be implicitly casted to `toT`
 */
export function castable(fromT: TypeNode, toT: TypeNode, compilerVersion: string): boolean {
    if (eq(fromT, toT)) {
        return true;
    }

    /**
     * When casting arrays to storage, we can cast fixed sized to dynamically sized arrays
     */
    if (
        fromT instanceof PointerType &&
        fromT.to instanceof ArrayType &&
        toT instanceof PointerType &&
        toT.to instanceof ArrayType &&
        fromT.to.size !== undefined &&
        toT.to.size === undefined &&
        toT.location === DataLocation.Storage &&
        eq(fromT.to.elementT, toT.to.elementT)
    ) {
        return true;
    }

    if (fromT instanceof PointerType && toT instanceof PointerType && eq(fromT.to, toT.to)) {
        return true;
    }

    if (fromT instanceof StringLiteralType) {
        /**
         * @todo Should we make an explicit check that string literal fits to bytes size?
         * Note that string length is not the same as count of bytes in string due to multibyte chars.
         * Also for hex string literals we should check evenness of length.
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
        // In solidity >= 0.5.0 negative constants can't be vast to bytes
        if (
            toT instanceof FixedBytesType &&
            fromT.literal !== undefined &&
            fitsNBytes(fromT.literal, toT.size, false) &&
            gte(compilerVersion, "0.5.0")
        ) {
            return true;
        }

        // In solidity < 0.5.0 negative constants can be vast to bytes
        if (
            toT instanceof FixedBytesType &&
            fromT.literal !== undefined &&
            (fitsNBytes(fromT.literal, toT.size, false) ||
                fitsNBytes(fromT.literal, toT.size, true)) &&
            lt(compilerVersion, "0.5.0")
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

        // In Solidity <=0.8.0 we can cast an unsigned type to a bigger signed type
        if (toT instanceof IntType && !fromT.signed && toT.signed && fromT.nBits < toT.nBits) {
            return true;
        }

        /**
         * Can implicitly cast from unsigned ints <=160 bits to address
         */
        if (toT instanceof AddressType && !fromT.signed && fromT.nBits <= 160) {
            return true;
        }
    }

    if (fromT instanceof UserDefinedType && fromT.definition instanceof ContractDefinition) {
        if (toT instanceof AddressType) {
            // We can implicitly cast from contract to payable address if it has a payable receive/fallback function
            if (toT.payable) {
                return forAny(
                    getFallbackRecvFuns(fromT.definition),
                    (fn) => fn.stateMutability === FunctionStateMutability.Payable
                );
            }

            // We can implicitly cast from contract to non-payable address
            return true;
        }

        // We can implicitly up-cast a contract
        if (toT instanceof UserDefinedType && toT.definition instanceof ContractDefinition) {
            return fromT.definition.isSubclassOf(toT.definition);
        }
    }

    if (
        fromT instanceof FunctionType &&
        toT instanceof FunctionType &&
        eq(new TupleType(fromT.parameters), new TupleType(toT.parameters)) &&
        eq(new TupleType(fromT.returns), new TupleType(toT.returns)) &&
        functionVisibilitiesCompatible(fromT.visibility, toT.visibility) &&
        fromT.mutability === toT.mutability
    ) {
        return true;
    }

    return false;
}

const signedLimits: Array<[bigint, bigint]> = [];
const unsignedLimits: Array<[bigint, bigint]> = [];

for (let i = 1n; i <= 32n; i++) {
    unsignedLimits.push([0n, 2n ** (i * 8n) - 1n]);
    signedLimits.push([-(2n ** (i * 8n - 1n)), 2n ** (i * 8n - 1n) - 1n]);
}

function fitsNBytes(literal: bigint, nBytes: number, signed: boolean) {
    const limits = signed ? signedLimits : unsignedLimits;

    return literal >= limits[nBytes - 1][0] && literal <= limits[nBytes - 1][1];
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

/**
 * Helper to cast the bigint `val` to the `IntType` `type`.
 */
export function clampIntToType(val: bigint, type: IntType): bigint {
    const min = type.min();
    const max = type.max();

    const size = max - min + 1n;

    return val < min ? ((val - max) % size) + max : ((val - min) % size) + min;
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
