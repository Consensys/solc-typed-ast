import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ContractKind } from "../constants";
import { ContractDefinition } from "../implementation/declaration/contract_definition";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyContractDefinitionProcessor extends LegacyNodeProcessor<ContractDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ContractDefinition> {
        const [id, src] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const name: string = attributes.name;
        const scope: number = attributes.scope;
        const kind: ContractKind = attributes.contractKind;
        const abstract: boolean = "abstract" in attributes ? attributes.abstract : false;
        const fullyImplemented: boolean = attributes.fullyImplemented;
        const linearizedBaseContracts: number[] = attributes.linearizedBaseContracts;

        let documentation: string | StructuredDocumentation | undefined;

        if (typeof attributes.documentation === "string") {
            documentation = attributes.documentation as string;
        } else if (children) {
            const firstChild = children[0];

            documentation = firstChild instanceof StructuredDocumentation ? firstChild : undefined;
        }

        return [
            id,
            src,
            name,
            scope,
            kind,
            abstract,
            fullyImplemented,
            linearizedBaseContracts,
            [],
            [],
            documentation,
            children,
            undefined,
            raw
        ];
    }
}
