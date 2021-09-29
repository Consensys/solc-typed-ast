import { assert } from "../../../misc/utils";
import {
    FunctionType,
    generalizeType,
    IntType,
    PointerType,
    TupleType,
    typeNameToSpecializedTypeNode,
    TypeNode,
    UserDefinedType,
    variableDeclarationToTypeNode
} from "../../../types";
import { ABIEncoderVersion, abiTypeToCanonicalName, toABIEncodedType } from "../../../types/abi";
import { ASTNode } from "../../ast_node";
import {
    DataLocation,
    FunctionStateMutability,
    FunctionVisibility,
    Mutability,
    StateVariableVisibility
} from "../../constants";
import { encodeSignature } from "../../utils";
import { Expression } from "../expression/expression";
import { OverrideSpecifier } from "../meta/override_specifier";
import { StructuredDocumentation } from "../meta/structured_documentation";
import { ArrayTypeName } from "../type/array_type_name";
import { Mapping } from "../type/mapping";
import { TypeName } from "../type/type_name";
import { StructDefinition } from "./struct_definition";

export class VariableDeclaration extends ASTNode {
    /**
     * Set if the variable can not be assigned a new value after declaration
     */
    constant: boolean;

    /**
     * Set if variable declaration is marked as `indexed`.
     * Indexed variable declarations may appear in parameter list of event definitions.
     */
    indexed: boolean;

    /**
     * Identifier of the variable
     */
    name: string;

    /**
     * The source range for name string
     */
    nameLocation?: string;

    /**
     * Id of scoped node
     */
    scope: number;

    /**
     * Set if variable is a state variable. Not set is variable is local.
     */
    stateVariable: boolean;

    /**
     * Data storage location. For example: `storage`, `memory` or `calldata`.
     * If it's not set, then the value is `default`.
     */
    storageLocation: DataLocation;

    /**
     * State variable visibility, for example `public`, `internal` or `private`.
     */
    visibility: StateVariableVisibility;

    /**
     * Variable mutability, for example `mutable`, `immutable` or `constant`.
     */
    mutability: Mutability;

    /**
     * Type string
     */
    typeString: string;

    /**
     * Optional documentation appearing above the variable declaration:
     * - Is `undefined` when not specified.
     * - Is type of `string` for compatibility reasons.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.9` or newer.
     */
    documentation?: string | StructuredDocumentation;

    /**
     * Variable type. Can be empty for Solidity 0.4.x declarations with `var` keyword.
     */
    vType?: TypeName;

    /**
     * Override specifier if provided
     */
    vOverrideSpecifier?: OverrideSpecifier;

    /**
     * The expression that is assigned in place as part of the declaration.
     *
     * In common, it is set for state variables that have initializers in place.
     * Also, it is **not set** for declarations,
     * that are children of `VariableDeclarationStatement`,
     * as such statements have own initial value property
     * and may have tuple assignments.
     */
    vValue?: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        constant: boolean,
        indexed: boolean,
        name: string,
        scope: number,
        stateVariable: boolean,
        storageLocation: DataLocation,
        visibility: StateVariableVisibility,
        mutability: Mutability,
        typeString: string,
        documentation?: string | StructuredDocumentation,
        typeName?: TypeName,
        overrideSpecifier?: OverrideSpecifier,
        value?: Expression,
        nameLocation?: string,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.constant = constant;
        this.indexed = indexed;
        this.name = name;
        this.scope = scope;
        this.stateVariable = stateVariable;
        this.storageLocation = storageLocation;
        this.visibility = visibility;
        this.mutability = mutability;
        this.typeString = typeString;
        this.documentation = documentation;
        this.nameLocation = nameLocation;

        this.vType = typeName;
        this.vOverrideSpecifier = overrideSpecifier;
        this.vValue = value;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.documentation, this.vType, this.vOverrideSpecifier, this.vValue);
    }

    /**
     * Check type of scope as a VariableDeclaration can be in the scope of different declarations
     */
    get vScope(): ASTNode {
        return this.requiredContext.locate(this.scope);
    }

    set vScope(value: ASTNode) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.scope = value.id;
    }

    canonicalSignatureType(encoderVersion: ABIEncoderVersion): string {
        const type = variableDeclarationToTypeNode(this);
        const abiType = toABIEncodedType(type, encoderVersion);
        return abiTypeToCanonicalName(generalizeType(abiType)[0]);
    }

    /**
     * Computes the argument types and return type for the public accessor
     * corresponding to this state variable.
     */
    getterArgsAndReturn(): [TypeNode[], TypeNode] {
        const argTypes: TypeNode[] = [];

        let type = this.vType;

        assert(
            type !== undefined,
            "Called getterArgsAndReturn() on variable declaration without type",
            this
        );

        while (true) {
            if (type instanceof ArrayTypeName) {
                argTypes.push(new IntType(256, false));

                type = type.vBaseType;
            } else if (type instanceof Mapping) {
                argTypes.push(typeNameToSpecializedTypeNode(type.vKeyType, DataLocation.Memory));

                type = type.vValueType;
            } else {
                break;
            }
        }

        let retType = typeNameToSpecializedTypeNode(type, DataLocation.Memory);

        if (
            retType instanceof PointerType &&
            retType.to instanceof UserDefinedType &&
            retType.to.definition instanceof StructDefinition
        ) {
            const elements: TypeNode[] = [];

            for (const member of retType.to.definition.vMembers) {
                const memberT = member.vType;

                assert(
                    memberT !== undefined,
                    "Unexpected untyped struct member",
                    retType.to.definition
                );

                if (memberT instanceof Mapping || memberT instanceof ArrayTypeName) {
                    continue;
                }

                elements.push(typeNameToSpecializedTypeNode(memberT, DataLocation.Memory));
            }

            retType = new TupleType(elements);
        }

        return [argTypes, retType];
    }

    /**
     * Computes the function type for the public accessor corresponding to this
     * state variable.
     */
    getterFunType(): FunctionType {
        const [args, ret] = this.getterArgsAndReturn();

        return new FunctionType(
            this.name,
            args,
            ret instanceof TupleType ? ret.elements : [ret],
            FunctionVisibility.External,
            FunctionStateMutability.View
        );
    }

    /**
     * Computes the canonical signature for the public accessor corresponding to
     * this state variable.
     */
    getterCanonicalSignature(encoderVersion: ABIEncoderVersion): string {
        const [internalArgTypes] = this.getterArgsAndReturn();
        const argTypes = internalArgTypes.map((typ) => toABIEncodedType(typ, encoderVersion, true));

        return this.name + "(" + argTypes.map(abiTypeToCanonicalName).join(",") + ")";
    }

    /**
     * Computes the canonical signature hash for the public accessor
     * corresponding to this state variable.
     */
    getterCanonicalSignatureHash(encoderVersion: ABIEncoderVersion): string {
        return encodeSignature(this.getterCanonicalSignature(encoderVersion));
    }
}
