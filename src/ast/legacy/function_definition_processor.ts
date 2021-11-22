import { ASTNode } from "../ast_node";
import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { FunctionKind, FunctionStateMutability, FunctionVisibility } from "../constants";
import { FunctionDefinition } from "../implementation/declaration/function_definition";
import { ModifierInvocation } from "../implementation/meta/modifier_invocation";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { ParameterList } from "../implementation/meta/parameter_list";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { Block } from "../implementation/statement/block";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyFunctionDefinitionProcessor extends LegacyNodeProcessor<FunctionDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof FunctionDefinition> {
        const [id, src] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const scope: number = attributes.scope;
        const isConstructor: boolean = attributes.isConstructor;
        const visibility: FunctionVisibility = attributes.visibility;
        const virtual: boolean = "virtual" in attributes ? attributes.virtual : false;
        const name: string = attributes.name;
        const kind = this.detectFunctionKind(attributes);
        const stateMutability = this.detectStateMutability(attributes);

        const [
            structuredDocumentation,
            overrideSpecifier,
            parameters,
            returnParameters,
            modifiers,
            body
        ] = this.extract(children);

        let documentation: string | StructuredDocumentation | undefined;

        if (structuredDocumentation) {
            documentation = structuredDocumentation;
        } else if (typeof attributes.documentation === "string") {
            documentation = attributes.documentation;
        }

        return [
            id,
            src,
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
            undefined,
            raw
        ];
    }

    private detectFunctionKind(attributes: any): FunctionKind {
        if (attributes.kind) {
            return attributes.kind;
        }

        if (attributes.isConstructor) {
            return FunctionKind.Constructor;
        }

        return attributes.name === "" ? FunctionKind.Fallback : FunctionKind.Function;
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

    private extract(
        children: ASTNode[]
    ): [
        StructuredDocumentation | undefined,
        OverrideSpecifier | undefined,
        ParameterList,
        ParameterList,
        ModifierInvocation[],
        Block | undefined
    ] {
        let node = children.shift();

        let documentation: StructuredDocumentation | undefined;

        if (node instanceof StructuredDocumentation) {
            documentation = node;

            node = children.shift();
        }

        let overrideSpecifier: OverrideSpecifier | undefined;

        if (node instanceof OverrideSpecifier) {
            overrideSpecifier = node;

            node = children.shift();
        }

        const parameters = node as ParameterList;

        node = children.shift();

        const returnParameters = node as ParameterList;

        node = children.shift();

        const modifiers: ModifierInvocation[] = [];

        while (node instanceof ModifierInvocation) {
            modifiers.push(node);

            node = children.shift();
        }

        let body: Block | undefined;

        if (node) {
            body = node as Block;
        }

        return [documentation, overrideSpecifier, parameters, returnParameters, modifiers, body];
    }
}
