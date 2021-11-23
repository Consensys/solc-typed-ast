import { ASTNode } from "../ast_node";
import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { DataLocation, Mutability, StateVariableVisibility } from "../constants";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Expression } from "../implementation/expression/expression";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { TypeName } from "../implementation/type/type_name";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyVariableDeclarationProcessor extends LegacyNodeProcessor<VariableDeclaration> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof VariableDeclaration> {
        const [id, src] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const constant: boolean = attributes.constant;
        const indexed: boolean = attributes.indexed || false;
        const name: string = attributes.name;
        const scope: number = attributes.scope;
        const stateVariable: boolean = attributes.stateVariable;
        const storageLocation: DataLocation = attributes.storageLocation;
        const visibility: StateVariableVisibility = attributes.visibility;
        const typeString: string = attributes.type;

        let mutability: Mutability;

        if (typeof attributes.mutability === "string") {
            mutability = attributes.mutability;
        } else {
            mutability = constant ? Mutability.Constant : Mutability.Mutable;
        }

        const [typeName, overrideSpecifier, value, documentation] = this.extract(children);

        return [
            id,
            src,
            constant,
            indexed,
            name,
            scope,
            stateVariable,
            storageLocation,
            visibility,
            mutability,
            typeString,
            documentation,
            typeName,
            overrideSpecifier,
            value,
            undefined,
            raw
        ];
    }

    private extract(
        children: ASTNode[]
    ): [
        TypeName | undefined,
        OverrideSpecifier | undefined,
        Expression | undefined,
        StructuredDocumentation | undefined
    ] {
        let node = children.shift();

        let type: TypeName | undefined;

        if (node instanceof TypeName) {
            type = node as TypeName;

            node = children.shift();
        }

        let overrideSpecifier: OverrideSpecifier | undefined;

        if (node instanceof OverrideSpecifier) {
            overrideSpecifier = node as OverrideSpecifier;

            node = children.shift();
        }

        let value: Expression | undefined;

        if (node) {
            value = node as Expression;

            node = children.shift();
        }

        let documentation: StructuredDocumentation | undefined;

        if (node) {
            documentation = node as StructuredDocumentation;
        }

        return [type, overrideSpecifier, value, documentation];
    }
}
