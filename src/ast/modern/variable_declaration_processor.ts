import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { DataLocation, Mutability, StateVariableVisibility } from "../constants";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Expression } from "../implementation/expression/expression";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { TypeName } from "../implementation/type/type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernVariableDeclarationProcessor extends ModernNodeProcessor<VariableDeclaration> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof VariableDeclaration> {
        const [id, src, type] = super.process(reader, config, raw);

        const constant: boolean = raw.constant;
        const indexed: boolean = raw.indexed || false;
        const name: string = raw.name;
        const scope: number = raw.scope;
        const stateVariable: boolean = raw.stateVariable;
        const visibility: StateVariableVisibility = raw.visibility;
        const typeString: string = raw.typeDescriptions.typeString;

        const storageLocation: DataLocation =
            raw.storageLocation === "" ? DataLocation.Default : raw.storageLocation;

        let mutability: Mutability;

        if (typeof raw.mutability === "string") {
            mutability = raw.mutability;
        } else {
            mutability = constant ? Mutability.Constant : Mutability.Mutable;
        }

        const documentation = raw.documentation
            ? (reader.convert(raw.documentation, config) as StructuredDocumentation)
            : undefined;

        const overrideSpecifier = raw.overrides
            ? (reader.convert(raw.overrides, config) as OverrideSpecifier)
            : undefined;

        const typeName = raw.typeName
            ? (reader.convert(raw.typeName, config) as TypeName)
            : undefined;

        const value = raw.value ? (reader.convert(raw.value, config) as Expression) : undefined;

        return [
            id,
            src,
            type,
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
            raw
        ];
    }
}
