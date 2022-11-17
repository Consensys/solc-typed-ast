import { ASTNode } from "../ast_node";
import { ASTReaderConfiguration } from "../ast_reader";
import { ContractDefinition } from "../implementation/declaration/contract_definition";
import { EnumDefinition } from "../implementation/declaration/enum_definition";
import { EnumValue } from "../implementation/declaration/enum_value";
import { ErrorDefinition } from "../implementation/declaration/error_definition";
import { EventDefinition } from "../implementation/declaration/event_definition";
import { FunctionDefinition } from "../implementation/declaration/function_definition";
import { ModifierDefinition } from "../implementation/declaration/modifier_definition";
import { StructDefinition } from "../implementation/declaration/struct_definition";
import { UserDefinedValueTypeDefinition } from "../implementation/declaration/user_defined_value_type_definition";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Assignment } from "../implementation/expression/assignment";
import { BinaryOperation } from "../implementation/expression/binary_operation";
import { Conditional } from "../implementation/expression/conditional";
import { ElementaryTypeNameExpression } from "../implementation/expression/elementary_type_name_expression";
import { FunctionCall } from "../implementation/expression/function_call";
import { FunctionCallOptions } from "../implementation/expression/function_call_options";
import { Identifier } from "../implementation/expression/identifier";
import { IndexAccess } from "../implementation/expression/index_access";
import { IndexRangeAccess } from "../implementation/expression/index_range_access";
import { Literal } from "../implementation/expression/literal";
import { MemberAccess } from "../implementation/expression/member_access";
import { NewExpression } from "../implementation/expression/new_expression";
import { TupleExpression } from "../implementation/expression/tuple_expression";
import { UnaryOperation } from "../implementation/expression/unary_operation";
import { IdentifierPath } from "../implementation/meta/identifier_path";
import { ImportDirective } from "../implementation/meta/import_directive";
import { InheritanceSpecifier } from "../implementation/meta/inheritance_specifier";
import { ModifierInvocation } from "../implementation/meta/modifier_invocation";
import { OverrideSpecifier } from "../implementation/meta/override_specifier";
import { ParameterList } from "../implementation/meta/parameter_list";
import { PragmaDirective } from "../implementation/meta/pragma_directive";
import { SourceUnit } from "../implementation/meta/source_unit";
import { StructuredDocumentation } from "../implementation/meta/structured_documentation";
import { UsingForDirective } from "../implementation/meta/using_for_directive";
import { Block } from "../implementation/statement/block";
import { Break } from "../implementation/statement/break";
import { Continue } from "../implementation/statement/continue";
import { DoWhileStatement } from "../implementation/statement/do_while_statement";
import { EmitStatement } from "../implementation/statement/emit_statement";
import { ExpressionStatement } from "../implementation/statement/expression_statement";
import { ForStatement } from "../implementation/statement/for_statement";
import { IfStatement } from "../implementation/statement/if_statement";
import { InlineAssembly } from "../implementation/statement/inline_assembly";
import { PlaceholderStatement } from "../implementation/statement/placeholder_statement";
import { Return } from "../implementation/statement/return";
import { RevertStatement } from "../implementation/statement/revert_statement";
import { Throw } from "../implementation/statement/throw";
import { TryCatchClause } from "../implementation/statement/try_catch_clause";
import { TryStatement } from "../implementation/statement/try_statement";
import { UncheckedBlock } from "../implementation/statement/unchecked_block";
import { VariableDeclarationStatement } from "../implementation/statement/variable_declaration_statement";
import { WhileStatement } from "../implementation/statement/while_statement";
import { ArrayTypeName } from "../implementation/type/array_type_name";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { FunctionTypeName } from "../implementation/type/function_type_name";
import { Mapping } from "../implementation/type/mapping";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import {
    YulAssignment,
    YulBlock,
    YulBreak,
    YulCase,
    YulContinue,
    YulExpressionStatement,
    YulFunctionCall,
    YulFunctionDefinition,
    YulForLoop,
    YulIdentifier,
    YulIf,
    YulLeave,
    YulLiteral,
    YulSwitch,
    YulTypedName,
    YulVariableDeclaration
} from "../implementation/yul";
import { ModernArrayTypeNameProcessor } from "./array_type_name_processor";
import { ModernAssignmentProcessor } from "./assignment_processor";
import { ModernBinaryOperationProcessor } from "./binary_operation_processor";
import { ModernBlockProcessor } from "./block_processor";
import { ModernBreakProcessor } from "./break_processor";
import { ModernConditionalProcessor } from "./conditional_processor";
import { ModernContinueProcessor } from "./continue_processor";
import { ModernContractDefinitionProcessor } from "./contract_definition_processor";
import { ModernDoWhileStatementProcessor } from "./do_while_statement_processor";
import { ModernElementaryTypeNameExpressionProcessor } from "./elementary_type_name_expression_processor";
import { ModernElementaryTypeNameProcessor } from "./elementary_type_name_processor";
import { ModernEmitStatementProcessor } from "./emit_statement_processor";
import { ModernEnumDefinitionProcessor } from "./enum_definition_processor";
import { ModernEnumValueProcessor } from "./enum_value_processor";
import { ModernErrorDefinitionProcessor } from "./error_definition_processor";
import { ModernEventDefinitionProcessor } from "./event_definition_processor";
import { ModernExpressionStatementProcessor } from "./expression_statement_processor";
import { ModernForStatementProcessor } from "./for_statement_processor";
import { ModernFunctionCallOptionsProcessor } from "./function_call_options_processor";
import { ModernFunctionCallProcessor } from "./function_call_processor";
import { ModernFunctionDefinitionProcessor } from "./function_definition_processor";
import { ModernFunctionTypeNameProcessor } from "./function_type_name_processor";
import { ModernIdentifierPathProcessor } from "./identifier_path_processor";
import { ModernIdentifierProcessor } from "./identifier_processor";
import { ModernIfStatementProcessor } from "./if_statement_processor";
import { ModernImportDirectiveProcessor } from "./import_directive_processor";
import { ModernIndexAccessProcessor } from "./index_access_processor";
import { ModernIndexRangeAccessProcessor } from "./index_range_access_processor";
import { ModernInheritanceSpecifierProcessor } from "./inheritance_specifier_processor";
import { ModernInlineAssemblyProcessor } from "./inline_assembly_processor";
import { ModernLiteralProcessor } from "./literal_processor";
import { ModernMappingProcessor } from "./mapping_processor";
import { ModernMemberAccessProcessor } from "./member_access_processor";
import { ModernModifierDefinitionProcessor } from "./modifier_definition_processor";
import { ModernModifierInvocationProcessor } from "./modifier_invocation_processor";
import { ModernNewExpressionProcessor } from "./new_expression_processor";
import { ModernNodeProcessor } from "./node_processor";
import { ModernOverrideSpecifierProcessor } from "./override_specifier_processor";
import { ModernParameterListProcessor } from "./parameter_list_processor";
import { ModernPlaceholderStatementProcessor } from "./placeholder_statement_processor";
import { ModernPragmaDirectiveProcessor } from "./pragma_directive_processor";
import { ModernReturnProcessor } from "./return_processor";
import { ModernRevertStatementProcessor } from "./revert_statement_processor";
import { ModernSourceUnitProcessor } from "./source_unit_processor";
import { ModernStructuredDocumentationProcessor } from "./structured_documentation_processor";
import { ModernStructDefinitionProcessor } from "./struct_definition_processor";
import { ModernThrowProcessor } from "./throw_processor";
import { ModernTryCatchClauseProcessor } from "./try_catch_clause_processor";
import { ModernTryStatementProcessor } from "./try_statement_processor";
import { ModernTupleExpressionProcessor } from "./tuple_expression_processor";
import { ModernUnaryOperationProcessor } from "./unary_operation_processor";
import { ModernUncheckedBlockProcessor } from "./unchecked_block_processor";
import { ModernUserDefinedTypeNameProcessor } from "./user_defined_type_name_processor";
import { ModernUserDefinedValueTypeDefinitionProcessor } from "./user_defined_value_type_definition_processor";
import { ModernUsingForDirectiveProcessor } from "./using_for_directive_processor";
import { ModernVariableDeclarationProcessor } from "./variable_declaration_processor";
import { ModernVariableDeclarationStatementProcessor } from "./variable_declaration_statement_processor";
import { ModernWhileStatementProcessor } from "./while_statement_processor";

import { ModernYulAssignmentProcessor } from "./yul_assignment_processor";
import { ModernYulBlockProcessor } from "./yul_block_processor";
import { ModernYulBreakProcessor } from "./yul_break_processor";
import { ModernYulCaseProcessor } from "./yul_case_processor";
import { ModernYulContinueProcessor } from "./yul_continue_processor";
import { ModernYulExpressionStatementProcessor } from "./yul_expression_statement_processor";
import { ModernYulForLoopProcessor } from "./yul_for_loop_processor";
import { ModernYulFunctionCallProcessor } from "./yul_function_call_processor";
import { ModernYulFunctionDefinitionProcessor } from "./yul_function_definition_processor";
import { ModernYulIdentifierProcessor } from "./yul_identifier_processor";
import { ModernYulIfProcessor } from "./yul_if_processor";
import { ModernYulLeaveProcessor } from "./yul_leave_processor";
import { ModernYulLiteralProcessor } from "./yul_literal_processor";
import { ModernYulSwitchProcessor } from "./yul_switch_processor";
import { ModernYulTypedNameProcessor } from "./yul_typed_name_processor";
import { ModernYulVariableDeclarationProcessor } from "./yul_variable_declaration_processor";

const processors = {
    /**
     * For any non-existent nodes:
     */
    Default: new ModernNodeProcessor(),

    /**
     * Precise for specific nodes:
     */
    SourceUnit: new ModernSourceUnitProcessor(),
    PragmaDirective: new ModernPragmaDirectiveProcessor(),
    IdentifierPath: new ModernIdentifierPathProcessor(),
    ImportDirective: new ModernImportDirectiveProcessor(),
    UsingForDirective: new ModernUsingForDirectiveProcessor(),
    ContractDefinition: new ModernContractDefinitionProcessor(),
    InheritanceSpecifier: new ModernInheritanceSpecifierProcessor(),
    StructDefinition: new ModernStructDefinitionProcessor(),
    ErrorDefinition: new ModernErrorDefinitionProcessor(),
    EventDefinition: new ModernEventDefinitionProcessor(),
    FunctionDefinition: new ModernFunctionDefinitionProcessor(),
    VariableDeclaration: new ModernVariableDeclarationProcessor(),
    Block: new ModernBlockProcessor(),
    OverrideSpecifier: new ModernOverrideSpecifierProcessor(),
    StructuredDocumentation: new ModernStructuredDocumentationProcessor(),
    ParameterList: new ModernParameterListProcessor(),
    EnumDefinition: new ModernEnumDefinitionProcessor(),
    EnumValue: new ModernEnumValueProcessor(),
    ModifierDefinition: new ModernModifierDefinitionProcessor(),
    ModifierInvocation: new ModernModifierInvocationProcessor(),
    UserDefinedTypeName: new ModernUserDefinedTypeNameProcessor(),
    ElementaryTypeName: new ModernElementaryTypeNameProcessor(),
    FunctionTypeName: new ModernFunctionTypeNameProcessor(),
    ArrayTypeName: new ModernArrayTypeNameProcessor(),
    Mapping: new ModernMappingProcessor(),
    Literal: new ModernLiteralProcessor(),
    Conditional: new ModernConditionalProcessor(),
    ElementaryTypeNameExpression: new ModernElementaryTypeNameExpressionProcessor(),
    IndexAccess: new ModernIndexAccessProcessor(),
    IndexRangeAccess: new ModernIndexRangeAccessProcessor(),
    Identifier: new ModernIdentifierProcessor(),
    MemberAccess: new ModernMemberAccessProcessor(),
    NewExpression: new ModernNewExpressionProcessor(),
    TupleExpression: new ModernTupleExpressionProcessor(),
    UnaryOperation: new ModernUnaryOperationProcessor(),
    BinaryOperation: new ModernBinaryOperationProcessor(),
    FunctionCallOptions: new ModernFunctionCallOptionsProcessor(),
    FunctionCall: new ModernFunctionCallProcessor(),
    Assignment: new ModernAssignmentProcessor(),
    IfStatement: new ModernIfStatementProcessor(),
    ForStatement: new ModernForStatementProcessor(),
    DoWhileStatement: new ModernDoWhileStatementProcessor(),
    WhileStatement: new ModernWhileStatementProcessor(),
    TryCatchClause: new ModernTryCatchClauseProcessor(),
    TryStatement: new ModernTryStatementProcessor(),
    Return: new ModernReturnProcessor(),
    RevertStatement: new ModernRevertStatementProcessor(),
    EmitStatement: new ModernEmitStatementProcessor(),
    ExpressionStatement: new ModernExpressionStatementProcessor(),
    UncheckedBlock: new ModernUncheckedBlockProcessor(),
    VariableDeclarationStatement: new ModernVariableDeclarationStatementProcessor(),
    InlineAssembly: new ModernInlineAssemblyProcessor(),
    Break: new ModernBreakProcessor(),
    Continue: new ModernContinueProcessor(),
    PlaceholderStatement: new ModernPlaceholderStatementProcessor(),
    Throw: new ModernThrowProcessor(),
    UserDefinedValueTypeDefinition: new ModernUserDefinedValueTypeDefinitionProcessor(),
    YulAssignment: new ModernYulAssignmentProcessor(),
    YulBlock: new ModernYulBlockProcessor(),
    YulBreak: new ModernYulBreakProcessor(),
    YulCase: new ModernYulCaseProcessor(),
    YulContinue: new ModernYulContinueProcessor(),
    YulExpressionStatement: new ModernYulExpressionStatementProcessor(),
    YulFunctionCall: new ModernYulFunctionCallProcessor(),
    YulFunctionDefinition: new ModernYulFunctionDefinitionProcessor(),
    YulForLoop: new ModernYulForLoopProcessor(),
    YulIdentifier: new ModernYulIdentifierProcessor(),
    YulIf: new ModernYulIfProcessor(),
    YulLeave: new ModernYulLeaveProcessor(),
    YulLiteral: new ModernYulLiteralProcessor(),
    YulSwitch: new ModernYulSwitchProcessor(),
    YulTypedName: new ModernYulTypedNameProcessor(),
    YulVariableDeclaration: new ModernYulVariableDeclarationProcessor()
};

export const ModernConfiguration: ASTReaderConfiguration = {
    signatureDetector: (raw: any) => raw.nodeType,

    rules: {
        Default: {
            constructor: ASTNode,
            processor: processors.Default
        },

        SourceUnit: {
            constructor: SourceUnit,
            processor: processors.SourceUnit
        },

        PragmaDirective: {
            constructor: PragmaDirective,
            processor: processors.PragmaDirective
        },

        IdentifierPath: {
            constructor: IdentifierPath,
            processor: processors.IdentifierPath
        },

        ImportDirective: {
            constructor: ImportDirective,
            processor: processors.ImportDirective
        },

        UsingForDirective: {
            constructor: UsingForDirective,
            processor: processors.UsingForDirective
        },

        ContractDefinition: {
            constructor: ContractDefinition,
            processor: processors.ContractDefinition
        },

        InheritanceSpecifier: {
            constructor: InheritanceSpecifier,
            processor: processors.InheritanceSpecifier
        },

        UserDefinedTypeName: {
            constructor: UserDefinedTypeName,
            processor: processors.UserDefinedTypeName
        },

        FunctionDefinition: {
            constructor: FunctionDefinition,
            processor: processors.FunctionDefinition
        },

        OverrideSpecifier: {
            constructor: OverrideSpecifier,
            processor: processors.OverrideSpecifier
        },

        StructuredDocumentation: {
            constructor: StructuredDocumentation,
            processor: processors.StructuredDocumentation
        },

        ParameterList: {
            constructor: ParameterList,
            processor: processors.ParameterList
        },

        Block: {
            constructor: Block,
            processor: processors.Block
        },

        VariableDeclaration: {
            constructor: VariableDeclaration,
            processor: processors.VariableDeclaration
        },

        StructDefinition: {
            constructor: StructDefinition,
            processor: processors.StructDefinition
        },

        ModifierDefinition: {
            constructor: ModifierDefinition,
            processor: processors.ModifierDefinition
        },

        ModifierInvocation: {
            constructor: ModifierInvocation,
            processor: processors.ModifierInvocation
        },

        Identifier: {
            constructor: Identifier,
            processor: processors.Identifier
        },

        ErrorDefinition: {
            constructor: ErrorDefinition,
            processor: processors.ErrorDefinition
        },

        EventDefinition: {
            constructor: EventDefinition,
            processor: processors.EventDefinition
        },

        EnumDefinition: {
            constructor: EnumDefinition,
            processor: processors.EnumDefinition
        },

        EnumValue: {
            constructor: EnumValue,
            processor: processors.EnumValue
        },

        ElementaryTypeName: {
            constructor: ElementaryTypeName,
            processor: processors.ElementaryTypeName
        },

        FunctionTypeName: {
            constructor: FunctionTypeName,
            processor: processors.FunctionTypeName
        },

        ArrayTypeName: {
            constructor: ArrayTypeName,
            processor: processors.ArrayTypeName
        },

        Mapping: {
            constructor: Mapping,
            processor: processors.Mapping
        },

        Literal: {
            constructor: Literal,
            processor: processors.Literal
        },

        Conditional: {
            constructor: Conditional,
            processor: processors.Conditional
        },

        ElementaryTypeNameExpression: {
            constructor: ElementaryTypeNameExpression,
            processor: processors.ElementaryTypeNameExpression
        },

        FunctionCallOptions: {
            constructor: FunctionCallOptions,
            processor: processors.FunctionCallOptions
        },

        FunctionCall: {
            constructor: FunctionCall,
            processor: processors.FunctionCall
        },

        IndexAccess: {
            constructor: IndexAccess,
            processor: processors.IndexAccess
        },

        IndexRangeAccess: {
            constructor: IndexRangeAccess,
            processor: processors.IndexRangeAccess
        },

        MemberAccess: {
            constructor: MemberAccess,
            processor: processors.MemberAccess
        },

        NewExpression: {
            constructor: NewExpression,
            processor: processors.NewExpression
        },

        TupleExpression: {
            constructor: TupleExpression,
            processor: processors.TupleExpression
        },

        UnaryOperation: {
            constructor: UnaryOperation,
            processor: processors.UnaryOperation
        },

        BinaryOperation: {
            constructor: BinaryOperation,
            processor: processors.BinaryOperation
        },

        Assignment: {
            constructor: Assignment,
            processor: processors.Assignment
        },

        IfStatement: {
            constructor: IfStatement,
            processor: processors.IfStatement
        },

        Continue: {
            constructor: Continue,
            processor: processors.Continue
        },

        Break: {
            constructor: Break,
            processor: processors.Break
        },

        Return: {
            constructor: Return,
            processor: processors.Return
        },

        RevertStatement: {
            constructor: RevertStatement,
            processor: processors.RevertStatement
        },

        ForStatement: {
            constructor: ForStatement,
            processor: processors.ForStatement
        },

        WhileStatement: {
            constructor: WhileStatement,
            processor: processors.WhileStatement
        },

        DoWhileStatement: {
            constructor: DoWhileStatement,
            processor: processors.DoWhileStatement
        },

        TryCatchClause: {
            constructor: TryCatchClause,
            processor: processors.TryCatchClause
        },

        TryStatement: {
            constructor: TryStatement,
            processor: processors.TryStatement
        },

        EmitStatement: {
            constructor: EmitStatement,
            processor: processors.EmitStatement
        },

        ExpressionStatement: {
            constructor: ExpressionStatement,
            processor: processors.ExpressionStatement
        },

        PlaceholderStatement: {
            constructor: PlaceholderStatement,
            processor: processors.PlaceholderStatement
        },

        UncheckedBlock: {
            constructor: UncheckedBlock,
            processor: processors.UncheckedBlock
        },

        VariableDeclarationStatement: {
            constructor: VariableDeclarationStatement,
            processor: processors.VariableDeclarationStatement
        },

        InlineAssembly: {
            constructor: InlineAssembly,
            processor: processors.InlineAssembly
        },

        Throw: {
            constructor: Throw,
            processor: processors.Throw
        },

        UserDefinedValueTypeDefinition: {
            constructor: UserDefinedValueTypeDefinition,
            processor: processors.UserDefinedValueTypeDefinition
        },

        YulAssignment: {
            constructor: YulAssignment,
            processor: processors.YulAssignment
        },

        YulBlock: {
            constructor: YulBlock,
            processor: processors.YulBlock
        },

        YulBreak: {
            constructor: YulBreak,
            processor: processors.YulBreak
        },

        YulCase: {
            constructor: YulCase,
            processor: processors.YulCase
        },

        YulContinue: {
            constructor: YulContinue,
            processor: processors.YulContinue
        },

        YulExpressionStatement: {
            constructor: YulExpressionStatement,
            processor: processors.YulExpressionStatement
        },

        YulFunctionCall: {
            constructor: YulFunctionCall,
            processor: processors.YulFunctionCall
        },

        YulFunctionDefinition: {
            constructor: YulFunctionDefinition,
            processor: processors.YulFunctionDefinition
        },

        YulForLoop: {
            constructor: YulForLoop,
            processor: processors.YulForLoop
        },

        YulIdentifier: {
            constructor: YulIdentifier,
            processor: processors.YulIdentifier
        },

        YulIf: {
            constructor: YulIf,
            processor: processors.YulIf
        },

        YulLeave: {
            constructor: YulLeave,
            processor: processors.YulLeave
        },

        YulLiteral: {
            constructor: YulLiteral,
            processor: processors.YulLiteral
        },

        YulSwitch: {
            constructor: YulSwitch,
            processor: processors.YulSwitch
        },

        YulTypedName: {
            constructor: YulTypedName,
            processor: processors.YulTypedName
        },

        YulVariableDeclaration: {
            constructor: YulVariableDeclaration,
            processor: processors.YulVariableDeclaration
        }
    }
};
