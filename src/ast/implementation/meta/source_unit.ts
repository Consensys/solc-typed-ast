import { ABIEncoderVersion, ABIEncoderVersions } from "../../../types";
import { ASTNode, ASTNodeWithChildren } from "../../ast_node";
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
            (node) => node instanceof PragmaDirective
        ) as PragmaDirective[];
    }

    /**
     * References to import directives
     */
    get vImportDirectives(): readonly ImportDirective[] {
        return this.ownChildren.filter(
            (node) => node instanceof ImportDirective
        ) as ImportDirective[];
    }

    /**
     * References to contract definitions
     */
    get vContracts(): readonly ContractDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof ContractDefinition
        ) as ContractDefinition[];
    }

    /**
     * References to file-level enum definitions
     */
    get vEnums(): readonly EnumDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof EnumDefinition
        ) as EnumDefinition[];
    }

    /**
     * References to file-level error definitions
     */
    get vErrors(): readonly ErrorDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof ErrorDefinition
        ) as ErrorDefinition[];
    }

    /**
     * References to file-level struct definitions
     */
    get vStructs(): readonly StructDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof StructDefinition
        ) as StructDefinition[];
    }

    /**
     * References to file-level function definitions (free functions)
     */
    get vFunctions(): readonly FunctionDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof FunctionDefinition
        ) as FunctionDefinition[];
    }

    /**
     * References to file-level constant variable definitions
     */
    get vVariables(): readonly VariableDeclaration[] {
        return this.ownChildren.filter(
            (node) => node instanceof VariableDeclaration
        ) as VariableDeclaration[];
    }

    /**
     * References to file-level user-defined value type definitions
     */
    get vUserDefinedValueTypes(): readonly UserDefinedValueTypeDefinition[] {
        return this.ownChildren.filter(
            (node) => node instanceof UserDefinedValueTypeDefinition
        ) as UserDefinedValueTypeDefinition[];
    }

    /**
     * References to file-level using-for directives
     */
    get vUsingForDirectives(): readonly UsingForDirective[] {
        return this.ownChildren.filter(
            (node) => node instanceof UsingForDirective
        ) as UsingForDirective[];
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
