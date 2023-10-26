import { ABIEncoderVersion, ABIEncoderVersions } from "../../../types";
import { ASTNode, ASTNodeWithChildren } from "../../ast_node";
import { EventDefinition } from "../declaration";
import { ContractDefinition } from "../declaration/contract_definition";
import { EnumDefinition } from "../declaration/enum_definition";
import { ErrorDefinition } from "../declaration/error_definition";
import { FunctionDefinition } from "../declaration/function_definition";
import { StructDefinition } from "../declaration/struct_definition";
import { UserDefinedValueTypeDefinition } from "../declaration/user_defined_value_type_definition";
import { VariableDeclaration } from "../declaration/variable_declaration";
import { ImportDirective } from "./import_directive";
import { PragmaDirective } from "./pragma_directive";
import { UsingForDirective } from "./using_for_directive";

export type ExportedSymbol =
    | ContractDefinition
    | StructDefinition
    | EnumDefinition
    | ErrorDefinition
    | FunctionDefinition
    | EventDefinition
    | UserDefinedValueTypeDefinition
    | VariableDeclaration
    | ImportDirective;

export class SourceUnit extends ASTNodeWithChildren<ASTNode> {
    /**
     * Original "sources" key, that corresponds to current AST entry.
     */
    sourceEntryKey: string;

    /**
     * Index of the source unit in the "sourceList".
     */
    sourceListIndex: number;

    /**
     * File path to the source file
     */
    absolutePath: string;

    /**
     * Exported symbols dictionary, e.g. `{ "A": 74, "B": 34, ... }`
     */
    exportedSymbols: Map<string, number>;

    /**
     * SPDX license identifier (if provided)
     */
    license?: string;

    constructor(
        id: number,
        src: string,
        sourceEntryKey: string,
        sourceListIndex: number,
        absolutePath: string,
        exportedSymbols: Map<string, number>,
        children?: Iterable<ASTNode>,
        license?: string,
        raw?: any
    ) {
        super(id, src, raw);

        this.sourceEntryKey = sourceEntryKey;
        this.sourceListIndex = sourceListIndex;
        this.absolutePath = absolutePath;
        this.exportedSymbols = exportedSymbols;
        this.license = license;

        if (children) {
            for (const node of children) {
                this.appendChild(node);
            }
        }
    }

    /**
     * References to pragma directives
     */
    get vPragmaDirectives(): readonly PragmaDirective[] {
        return this.ownChildren.filter(
            (node): node is PragmaDirective => node instanceof PragmaDirective
        );
    }

    /**
     * References to import directives
     */
    get vImportDirectives(): readonly ImportDirective[] {
        return this.ownChildren.filter(
            (node): node is ImportDirective => node instanceof ImportDirective
        );
    }

    /**
     * References to contract definitions
     */
    get vContracts(): readonly ContractDefinition[] {
        return this.ownChildren.filter(
            (node): node is ContractDefinition => node instanceof ContractDefinition
        );
    }

    /**
     * References to file-level enum definitions
     */
    get vEnums(): readonly EnumDefinition[] {
        return this.ownChildren.filter(
            (node): node is EnumDefinition => node instanceof EnumDefinition
        );
    }

    /**
     * References to file-level error definitions
     */
    get vErrors(): readonly ErrorDefinition[] {
        return this.ownChildren.filter(
            (node): node is ErrorDefinition => node instanceof ErrorDefinition
        );
    }

    /**
     * References to file-level struct definitions
     */
    get vStructs(): readonly StructDefinition[] {
        return this.ownChildren.filter(
            (node): node is StructDefinition => node instanceof StructDefinition
        );
    }

    /**
     * References to file-level function definitions (free functions)
     */
    get vFunctions(): readonly FunctionDefinition[] {
        return this.ownChildren.filter(
            (node): node is FunctionDefinition => node instanceof FunctionDefinition
        );
    }

    /**
     * References to file-level event definitions
     */
    get vEvents(): readonly EventDefinition[] {
        return this.ownChildren.filter(
            (node): node is EventDefinition => node instanceof EventDefinition
        );
    }

    /**
     * References to file-level constant variable definitions
     */
    get vVariables(): readonly VariableDeclaration[] {
        return this.ownChildren.filter(
            (node): node is VariableDeclaration => node instanceof VariableDeclaration
        );
    }

    /**
     * References to file-level user-defined value type definitions
     */
    get vUserDefinedValueTypes(): readonly UserDefinedValueTypeDefinition[] {
        return this.ownChildren.filter(
            (node): node is UserDefinedValueTypeDefinition =>
                node instanceof UserDefinedValueTypeDefinition
        );
    }

    /**
     * References to file-level using-for directives
     */
    get vUsingForDirectives(): readonly UsingForDirective[] {
        return this.ownChildren.filter(
            (node): node is UsingForDirective => node instanceof UsingForDirective
        );
    }

    /**
     * Referenced exported symbols
     */
    get vExportedSymbols(): ReadonlyMap<string, ExportedSymbol> {
        const result = new Map<string, ExportedSymbol>();
        const context = this.requiredContext;

        for (const [name, id] of this.exportedSymbols.entries()) {
            result.set(name, context.locate(id) as ExportedSymbol);
        }

        return result;
    }

    /**
     * Returns user-defined ABI encoder version for the source unit.
     * If there is no encoder version defined in the pragma directives,
     * then returns `undefined`.
     */
    get abiEncoderVersion(): ABIEncoderVersion | undefined {
        for (const directive of this.vPragmaDirectives) {
            if (directive.vIdentifier === "abicoder") {
                const raw = directive.literals[1];

                if (raw === "v1") {
                    return ABIEncoderVersion.V1;
                }

                if (raw === "v2") {
                    return ABIEncoderVersion.V2;
                }

                throw new Error(`Unknown abicoder pragma version ${raw}`);
            }

            if (
                directive.vIdentifier === "experimental" &&
                directive.literals.length === 2 &&
                ABIEncoderVersions.has(directive.literals[1])
            ) {
                return directive.literals[1] as ABIEncoderVersion;
            }
        }

        return undefined;
    }
}
