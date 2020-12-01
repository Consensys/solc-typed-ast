import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionStateMutability, FunctionVisibility } from "../constants";
import { ParameterList } from "../implementation/meta/parameter_list";
import { FunctionTypeName } from "../implementation/type/function_type_name";
import { LegacyTypeNameProcessor } from "./type_name_processor";

export class LegacyFunctionTypeNameProcessor extends LegacyTypeNameProcessor<FunctionTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const visibility: FunctionVisibility = attributes.visibility;
        const stateMutability = this.detectStateMutability(attributes);

        const [parameterTypes, returnParameterTypes] = reader.convertArray(
            raw.children,
            config
        ) as [ParameterList, ParameterList];

        return [
            id,
            src,
            type,
            typeString,
            visibility,
            stateMutability,
            parameterTypes,
            returnParameterTypes,
            raw
        ];
    }

    private detectStateMutability(attributes: any): FunctionStateMutability {
        if (attributes.stateMutability) {
            return attributes.stateMutability;
        }

        if (attributes.constant) {
            return FunctionStateMutability.Constant;
        }

        return attributes.payable
            ? FunctionStateMutability.Payable
            : FunctionStateMutability.NonPayable;
    }
}
