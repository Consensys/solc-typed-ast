import {
    EnumDefinition,
    StructDefinition,
    ContractDefinition,
    TypeName,
    ElementaryTypeName,
    ArrayTypeName,
    Mapping,
    UserDefinedTypeName
} from "..";
import { ContractKind, FunctionVisibility } from "../constants";
import { Literal } from "../implementation/expression";
import { FunctionTypeName } from "../implementation/type";
import {
    BuiltinStructTypeName,
    IntLiteralTypeName,
    ModuleTypeName,
    StringLiteralTypeName,
    TypeNameTypeName
} from "../implementation/type/internal";
import { ReferenceTypeName } from "../implementation/type/internal/reference_type_name";
import { TupleTypeName } from "../implementation/type/internal/tuple_type_name";

function fqName(e: EnumDefinition | StructDefinition): string {
    return `${e.vScope instanceof ContractDefinition ? e.vScope.name + "." : ""}${e.name}`;
}

/**
 * Return a `typeString` similar to what Solidity generates in the AST for the specified `typeName` and `loc`
 */
export function makeTypeString(typeName: TypeName): string {
    if (typeName instanceof ElementaryTypeName) {
        if (typeName.name === "address") {
            return `address${typeName.stateMutability === "payable" ? " payable" : ""}`;
        }

        return typeName.name;
    }

    if (typeName instanceof ArrayTypeName) {
        const baseString = makeTypeString(typeName.vBaseType);
        let length: number | undefined;

        if (typeName.vLength) {
            if (typeName.vLength instanceof Literal) {
                length = parseInt(typeName.vLength.value);
            } else {
                throw new Error(
                    `Unsupported array length expression: ${typeName.vLength.constructor.name}`
                );
            }
        }
        return `${baseString}[${length !== undefined ? length : ""}]`;
    }

    if (typeName instanceof Mapping) {
        return `mapping(${makeTypeString(typeName.vKeyType)} => ${makeTypeString(
            typeName.vValueType
        )})`;
    }

    if (typeName instanceof UserDefinedTypeName) {
        const def = typeName.vReferencedDeclaration;
        if (def instanceof ContractDefinition) {
            return `${def.kind === ContractKind.Library ? "library" : "contract"} ${def.name}`;
        }

        if (def instanceof EnumDefinition) {
            return `enum ${fqName(def)}`;
        }

        if (def instanceof StructDefinition) {
            return `struct ${fqName(def)}`;
        }
    }

    if (typeName instanceof ReferenceTypeName) {
        return `${makeTypeString(typeName.toType)} ${typeName.location}${
            typeName.kind ? " " + typeName.kind : ""
        }`;
    }

    if (typeName instanceof TupleTypeName) {
        return `tuple(${typeName.components.map((comp) =>
            comp !== null ? makeTypeString(comp) : " "
        )})`;
    }

    if (typeName instanceof IntLiteralTypeName) {
        return `int_const ${typeName.literal}`;
    }

    if (typeName instanceof StringLiteralTypeName) {
        return `literal_string ${typeName.isHex ? "hex" : ""}"${typeName.literal}"`;
    }

    if (typeName instanceof TypeNameTypeName) {
        return `type(${makeTypeString(typeName.innerType)})`;
    }

    if (typeName instanceof FunctionTypeName) {
        const argStr = typeName.vParameterTypes.vParameters
            .map((decl) => makeTypeString(decl.vType as TypeName))
            .join(",");
        let retStr = typeName.vReturnParameterTypes.vParameters
            .map((decl) => makeTypeString(decl.vType as TypeName))
            .join(",");
        retStr = retStr !== "" ? ` returns (${retStr})` : retStr;

        const visStr =
            typeName.visibility !== FunctionVisibility.Internal ? ` ` + typeName.visibility : "";
        const mutStr =
            typeName.stateMutability !== "nonpayable" ? " " + typeName.stateMutability : "";

        return `function (${argStr})${mutStr}${visStr}${retStr}`;
    }

    if (typeName instanceof BuiltinStructTypeName) {
        return typeName.builtin;
    }

    if (typeName instanceof ModuleTypeName) {
        return `module "${typeName.path}"`;
    }

    throw new Error(`NYI typename ${typeName.constructor.name}`);
}
