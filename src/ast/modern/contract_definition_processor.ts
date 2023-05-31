import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ContractKind } from "../constants";
import { ContractDefinition } from "../implementation/declaration/contract_definition";
import { StructuredDocumentation } from "../implementation/meta";
import { ModernNodeProcessor } from "./node_processor";

export class ModernContractDefinitionProcessor extends ModernNodeProcessor<ContractDefinition> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ContractDefinition> {
        const [id, src] = super.process(reader, config, raw);

        const name: string = raw.name;
        const scope: number = raw.scope;
        const kind: ContractKind = raw.contractKind;
        const abstract: boolean = "abstract" in raw ? raw.abstract : false;
        const fullyImplemented: boolean = raw.fullyImplemented;
        const linearizedBaseContracts: number[] = raw.linearizedBaseContracts;
        const usedErrors: number[] = "usedErrors" in raw ? raw.usedErrors : [];
        const usedEvents: number[] = "usedEvents" in raw ? raw.usedEvents : [];
        const nameLocation: string | undefined = raw.nameLocation;

        let documentation: string | StructuredDocumentation | undefined;

        if (raw.documentation) {
            documentation =
                typeof raw.documentation === "string"
                    ? raw.documentation
                    : reader.convert(raw.documentation, config);
        }

        const baseContracts = reader.convertArray(raw.baseContracts, config);
        const nodes = reader.convertArray(raw.nodes, config);

        const children =
            documentation instanceof StructuredDocumentation
                ? [documentation, ...baseContracts, ...nodes]
                : [...baseContracts, ...nodes];

        return [
            id,
            src,
            name,
            scope,
            kind,
            abstract,
            fullyImplemented,
            linearizedBaseContracts,
            usedErrors,
            usedEvents,
            documentation,
            children,
            nameLocation,
            raw
        ];
    }
}
