import { assert, eq, forAll, pp } from "../misc";
import {
    ArrayType,
    BuiltinFunctionType,
    BuiltinStructType,
    ErrorType,
    EventType,
    FunctionType,
    MappingType,
    PointerType,
    TRest,
    TupleType,
    TVar,
    TypeNameType,
    TypeNode
} from "./ast";
import { SolTypeError } from "./misc";
import { castable } from "./utils";

export class SolTypePatternMismatchError extends SolTypeError {
    constructor(
        public readonly expected: TypeNode | TypeNode[],
        public readonly actual: TypeNode | TypeNode[]
    ) {
        super(`Pattern mismatch: expected ${pp(expected)} got ${pp(actual)}`);
    }
}

/**
 * To support type elipses in certain builtin constructs (abi.decode* family and
 * type(...)) we introduce a simple notion of polymorphism with 2 types of type
 * var - a normal type-var (used for example to type `type(T) => { min: T, max:
 * T} where T is numeric) and a type 'elispsis' var, that corresponds to the
 * remaining types in a tuple or argument list.
 */
export type TypeSubstituion = Map<string, TypeNode | TypeNode[]>;

/**
 * Given two types `a` and `b` where `a` may contain type vars, but
 * `b` doesn't have any type vars, compute a substituion from type var names
 * to type nodes that converts a to b
 */
export function buildSubstituion(
    a: TypeNode,
    b: TypeNode,
    m: TypeSubstituion,
    compilerVersion: string
): void {
    if (a instanceof TVar) {
        const existingMapping = m.get(a.name);

        if (existingMapping !== undefined) {
            if (!eq(existingMapping, b)) {
                throw new SolTypeError(
                    `Type var ${a.name} mapped to two different things: ${pp(
                        existingMapping
                    )} and ${b.pp()}`
                );
            }
        } else {
            m.set(a.name, b);
        }

        return;
    }

    if (a instanceof ArrayType && b instanceof ArrayType) {
        if (a.size !== b.size) {
            throw new SolTypePatternMismatchError(a, b);
        }

        buildSubstituion(a.elementT, b.elementT, m, compilerVersion);
        return;
    }

    if (a instanceof FunctionType && b instanceof FunctionType) {
        if (a.visibility !== b.visibility || a.mutability !== b.mutability) {
            throw new SolTypePatternMismatchError(a, b);
        }

        buildSubstitutions(a.parameters, b.parameters, m, compilerVersion);
        buildSubstitutions(a.returns, b.returns, m, compilerVersion);
        return;
    }

    if (a instanceof BuiltinFunctionType && b instanceof BuiltinFunctionType) {
        buildSubstitutions(a.parameters, b.parameters, m, compilerVersion);
        buildSubstitutions(a.returns, b.returns, m, compilerVersion);
        return;
    }

    if (a instanceof MappingType && b instanceof MappingType) {
        buildSubstituion(a.keyType, b.keyType, m, compilerVersion);
        buildSubstituion(a.valueType, b.valueType, m, compilerVersion);
        return;
    }

    if (a instanceof PointerType && b instanceof PointerType) {
        buildSubstituion(a.to, b.to, m, compilerVersion);
        return;
    }

    if (a instanceof TupleType && b instanceof TupleType) {
        assert(
            forAll(a.elements, (el) => el !== null) && forAll(b.elements, (el) => el !== null),
            `Unexpected tuple with empty elements when building type substitution: {0} or {1}`,
            a,
            b
        );

        buildSubstitutions(a.elements as TypeNode[], b.elements as TypeNode[], m, compilerVersion);
        return;
    }

    if (a instanceof TypeNameType && b instanceof TypeNameType) {
        buildSubstituion(a.type, b.type, m, compilerVersion);
        return;
    }

    if (a instanceof BuiltinStructType && b instanceof BuiltinStructType) {
        if (a.members.size !== b.members.size) {
            throw new SolTypePatternMismatchError(a, b);
        }

        for (const [aName, aVerDepTypes] of a.members) {
            const bVerDepTypes = b.members.get(aName);

            if (bVerDepTypes === undefined) {
                throw new SolTypePatternMismatchError(a, b);
            }

            if (aVerDepTypes.length !== bVerDepTypes.length) {
                throw new SolTypePatternMismatchError(a, b);
            }

            for (let i = 0; i < aVerDepTypes.length; i++) {
                const [aType, aVer] = aVerDepTypes[i];
                const [bType, bVer] = bVerDepTypes[i];

                if (aVer !== bVer) {
                    throw new SolTypePatternMismatchError(a, b);
                }

                buildSubstituion(aType, bType, m, compilerVersion);
            }
        }

        return;
    }

    if (eq(a, b)) {
        return;
    }

    if (castable(b, a, compilerVersion)) {
        return;
    }

    throw new SolTypePatternMismatchError(a, b);
}

/**
 * Given two lists of types as and bs, and a partially computed TypeMap m,
 * accumulate the neccessary substitutions to convert as into bs. Note that as
 * may contain TVars and TRest, but bs must be concrete.
 */
export function buildSubstitutions(
    as: TypeNode[],
    bs: TypeNode[],
    m: TypeSubstituion,
    compilerVersion: string
): void {
    for (let i = 0; i < as.length; i++) {
        // Note below we allow the last TRest to match to an empty list of types.
        if (i >= bs.length && !(i === as.length - 1 && as[i] instanceof TRest)) {
            throw new SolTypePatternMismatchError(as, bs);
        }

        const patternT = as[i];

        if (patternT instanceof TRest) {
            const existingMapping = m.get(patternT.name);
            const actual = bs.slice(i);

            if (existingMapping !== undefined) {
                if (!eq(existingMapping, actual)) {
                    throw new SolTypeError(
                        `Type var ${patternT.name} mapped to two different things: ${pp(
                            existingMapping
                        )} and ${pp(actual)}`
                    );
                }
            } else {
                m.set(patternT.name, actual);
            }

            return;
        }

        buildSubstituion(patternT, bs[i], m, compilerVersion);
    }
}

/**
 * Given a type node `a` that may contain type vars, and a substitution `m`, apply all the
 * substitutions in `m` to `a` and return the resulting TypeNode.
 */
export function applySubstitution(a: TypeNode, m: TypeSubstituion): TypeNode {
    if (a instanceof TVar) {
        const mapped = m.get(a.name);

        assert(
            !(mapped instanceof Array),
            "Unexpected mapping from tvar {0} to list of types {1}",
            a.name,
            mapped
        );

        return mapped ? mapped : a;
    }

    if (a instanceof ArrayType) {
        return new ArrayType(applySubstitution(a.elementT, m), a.size);
    }

    if (a instanceof FunctionType) {
        return new FunctionType(
            a.name,
            applySubstitutions(a.parameters, m),
            applySubstitutions(a.returns, m),
            a.visibility,
            a.mutability,
            a.implicitFirstArg
        );
    }

    if (a instanceof BuiltinFunctionType) {
        return new BuiltinFunctionType(
            a.name,
            applySubstitutions(a.parameters, m),
            applySubstitutions(a.returns, m)
        );
    }

    if (a instanceof EventType) {
        return new EventType(a.name, applySubstitutions(a.parameters, m));
    }

    if (a instanceof ErrorType) {
        return new ErrorType(a.name as string, applySubstitutions(a.parameters, m));
    }

    if (a instanceof MappingType) {
        return new MappingType(applySubstitution(a.keyType, m), applySubstitution(a.valueType, m));
    }

    if (a instanceof PointerType) {
        return new PointerType(applySubstitution(a.to, m), a.location, a.kind);
    }

    if (a instanceof TupleType) {
        assert(
            forAll(a.elements, (el) => el !== null),
            "Unexpected tuple with empty elements when applying type substitution: {0}",
            a
        );

        return new TupleType(applySubstitutions(a.elements as TypeNode[], m));
    }

    if (a instanceof TypeNameType) {
        return new TypeNameType(applySubstitution(a.type, m));
    }

    if (a instanceof BuiltinStructType) {
        const oldMembers = [...a.members.entries()];

        return new BuiltinStructType(
            a.name,
            new Map(
                oldMembers.map(([name, verDepTypes]) => [
                    name,
                    verDepTypes.map(([type, ver]) => [applySubstitution(type, m), ver])
                ])
            )
        );
    }

    return a;
}

/**
 * Given a list of type nodes `as` that may contain type vars and type elipsis, and a substitution `m`, apply all the
 * substitutions in `m` to `as` and return the resulting list of type nodes.
 */
export function applySubstitutions(as: TypeNode[], m: TypeSubstituion): TypeNode[] {
    const resTs: TypeNode[] = [];

    for (let i = 0; i < as.length; i++) {
        const elT = as[i];

        if (elT instanceof TRest) {
            assert(i === as.length - 1, "Unexpected TRest not in the last place in a type list`");

            const mapped = m.get(elT.name);

            if (mapped) {
                assert(
                    mapped instanceof Array,
                    `TRest ${elT.name} not mapped to array. Instead mapped to ${pp(mapped)}`
                );

                resTs.push(...mapped);
            } else {
                resTs.push(elT);
            }
        } else {
            resTs.push(applySubstitution(elT, m));
        }
    }

    return resTs;
}
