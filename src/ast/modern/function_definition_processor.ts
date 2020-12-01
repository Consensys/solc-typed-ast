import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionKind, FunctionStateMutability, FunctionVisibility } from "../constants";
import { FunctionDefinition } from "../implementation/declaration/function_definition";
import { ModifierInvocation } from "../implementation/meta/modifier_invocation";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { Block } from "../implementation/statement/block";
import { ModernNodeProcessor } from "./node_processor";

export class ModernFunctionDefinitionProcessor extends ModernNodeProcessor<FunctionDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionDefinition> {
        const [id, src, type] = super.process(reader, config, raw);

        const scope: number = raw.scope;
        const kind: FunctionKind = raw.kind;
        const isConstructor: boolean = raw.isConstructor || raw.kind === FunctionKind.Constructor;
        const visibility: FunctionVisibility = raw.visibility;
        const virtual: boolean = "virtual" in raw ? raw.virtual : false;
        const name: string = raw.name;
        const stateMutability: FunctionStateMutability = raw.stateMutability;

        let documentation: string | StructuredDocumentation | undefined;

        if (raw.documentation) {
            documentation =
                typeof raw.documentation === "string"
                    ? raw.documentation
                    : reader.convert(raw.documentation, config);
        }

        const overrideSpecifier = raw.overrides
            ? (reader.convert(raw.overrides, config) as OverrideSpecifier)
            : undefined;

        const parameters = reader.convert(raw.parameters, config) as ParameterList;
        const returnParameters = reader.convert(raw.returnParameters, config) as ParameterList;
        const modifiers = reader.convertArray(raw.modifiers, config) as ModifierInvocation[];
        const body = raw.body ? (reader.convert(raw.body, config) as Block) : undefined;

        return [
            id,
            src,
            type,
            scope,
            kind,
            name,
            virtual,
            visibility,
            stateMutability,
            isConstructor,
            parameters,
            returnParameters,
            modifiers,
            overrideSpecifier,
            body,
            documentation,
            raw
        ];
    }
}
