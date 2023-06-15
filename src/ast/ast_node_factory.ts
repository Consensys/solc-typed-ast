import { ASTNode, ASTNodeConstructor } from "./ast_node";
import { ASTContext, ASTPostprocessor } from "./ast_reader";
import { FunctionStateMutability, FunctionVisibility } from "./constants";
import { ContractDefinition } from "./implementation/declaration/contract_definition";
import { EnumDefinition } from "./implementation/declaration/enum_definition";
import { EnumValue } from "./implementation/declaration/enum_value";
import { ErrorDefinition } from "./implementation/declaration/error_definition";
import { EventDefinition } from "./implementation/declaration/event_definition";
import { FunctionDefinition } from "./implementation/declaration/function_definition";
import { ModifierDefinition } from "./implementation/declaration/modifier_definition";
import { StructDefinition } from "./implementation/declaration/struct_definition";
import { UserDefinedValueTypeDefinition } from "./implementation/declaration/user_defined_value_type_definition";
import { VariableDeclaration } from "./implementation/declaration/variable_declaration";
import { Assignment } from "./implementation/expression/assignment";
import { BinaryOperation } from "./implementation/expression/binary_operation";
import { Conditional } from "./implementation/expression/conditional";
import { ElementaryTypeNameExpression } from "./implementation/expression/elementary_type_name_expression";
import { FunctionCall } from "./implementation/expression/function_call";
import { FunctionCallOptions } from "./implementation/expression/function_call_options";
import { Identifier } from "./implementation/expression/identifier";
import { IndexAccess } from "./implementation/expression/index_access";
import { IndexRangeAccess } from "./implementation/expression/index_range_access";
import { Literal } from "./implementation/expression/literal";
import { MemberAccess } from "./implementation/expression/member_access";
import { NewExpression } from "./implementation/expression/new_expression";
import { PrimaryExpression } from "./implementation/expression/primary_expression";
import { TupleExpression } from "./implementation/expression/tuple_expression";
import { UnaryOperation } from "./implementation/expression/unary_operation";
import { IdentifierPath } from "./implementation/meta/identifier_path";
import { ImportDirective } from "./implementation/meta/import_directive";
import { InheritanceSpecifier } from "./implementation/meta/inheritance_specifier";
import { ModifierInvocation } from "./implementation/meta/modifier_invocation";
import { OverrideSpecifier } from "./implementation/meta/override_specifier";
import { ParameterList } from "./implementation/meta/parameter_list";
import { PragmaDirective } from "./implementation/meta/pragma_directive";
import { SourceUnit } from "./implementation/meta/source_unit";
import { StructuredDocumentation } from "./implementation/meta/structured_documentation";
import { UsingForDirective } from "./implementation/meta/using_for_directive";
import { Block } from "./implementation/statement/block";
import { Break } from "./implementation/statement/break";
import { Continue } from "./implementation/statement/continue";
import { DoWhileStatement } from "./implementation/statement/do_while_statement";
import { EmitStatement } from "./implementation/statement/emit_statement";
import { ExpressionStatement } from "./implementation/statement/expression_statement";
import { ForStatement } from "./implementation/statement/for_statement";
import { IfStatement } from "./implementation/statement/if_statement";
import { InlineAssembly } from "./implementation/statement/inline_assembly";
import { PlaceholderStatement } from "./implementation/statement/placeholder_statement";
import { Return } from "./implementation/statement/return";
import { RevertStatement } from "./implementation/statement/revert_statement";
import { Throw } from "./implementation/statement/throw";
import { TryCatchClause } from "./implementation/statement/try_catch_clause";
import { TryStatement } from "./implementation/statement/try_statement";
import { UncheckedBlock } from "./implementation/statement/unchecked_block";
import { VariableDeclarationStatement } from "./implementation/statement/variable_declaration_statement";
import { WhileStatement } from "./implementation/statement/while_statement";
import { ArrayTypeName } from "./implementation/type/array_type_name";
import { ElementaryTypeName } from "./implementation/type/elementary_type_name";
import { FunctionTypeName } from "./implementation/type/function_type_name";
import { Mapping } from "./implementation/type/mapping";
import { UserDefinedTypeName } from "./implementation/type/user_defined_type_name";

/**
 * When applied to following tuple type:
 * ```
 * [id: number, src: string, type: string, rest: any]
 * ```
 * Skips first three arguments (`id`, `src` and `type`) and infers only `rest`.
 *
 * This will further be applied to constructor argument tuple types, like
 * `ConstructorParameters<typeof VariableDeclaration>` (for example)
 * to infer only `VariableDeclaration`-specific arguments as the necessary.
 * The leading `id`, `src` and `type` will be generated by `ASTNodeFactory`.
 */
type Specific<Args extends any[]> = Args["length"] extends 0
    ? undefined
    : ((...args: Args) => void) extends (id: number, src: string, ...rest: infer Rest) => void
    ? Rest
    : [];

type IDMap = Map<number, number>;

const argExtractionMapping = new Map<ASTNodeConstructor<ASTNode>, (node: any) => any[]>([
    [ASTNode, (node: ASTNode): Specific<ConstructorParameters<typeof ASTNode>> => [node.raw]],
    [
        ContractDefinition,
        (node: ContractDefinition): Specific<ConstructorParameters<typeof ContractDefinition>> => [
            node.name,
            node.scope,
            node.kind,
            node.abstract,
            node.fullyImplemented,
            node.linearizedBaseContracts,
            node.usedErrors,
            node.usedEvents,
            node.documentation,
            node.children,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        EnumDefinition,
        (node: EnumDefinition): Specific<ConstructorParameters<typeof EnumDefinition>> => [
            node.name,
            node.vMembers,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        EnumValue,
        (node: EnumValue): Specific<ConstructorParameters<typeof EnumValue>> => [
            node.name,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        ErrorDefinition,
        (node: ErrorDefinition): Specific<ConstructorParameters<typeof ErrorDefinition>> => [
            node.name,
            node.vParameters,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        EventDefinition,
        (node: EventDefinition): Specific<ConstructorParameters<typeof EventDefinition>> => [
            node.anonymous,
            node.name,
            node.vParameters,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        FunctionDefinition,
        (node: FunctionDefinition): Specific<ConstructorParameters<typeof FunctionDefinition>> => [
            node.scope,
            node.kind,
            node.name,
            node.virtual,
            node.visibility,
            node.stateMutability,
            node.isConstructor,
            node.vParameters,
            node.vReturnParameters,
            node.vModifiers,
            node.vOverrideSpecifier,
            node.vBody,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        ModifierDefinition,
        (node: ModifierDefinition): Specific<ConstructorParameters<typeof ModifierDefinition>> => [
            node.name,
            node.virtual,
            node.visibility,
            node.vParameters,
            node.vOverrideSpecifier,
            node.vBody,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        StructDefinition,
        (node: StructDefinition): Specific<ConstructorParameters<typeof StructDefinition>> => [
            node.name,
            node.scope,
            node.visibility,
            node.vMembers,
            node.documentation,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        UserDefinedValueTypeDefinition,
        (
            node: UserDefinedValueTypeDefinition
        ): Specific<ConstructorParameters<typeof UserDefinedValueTypeDefinition>> => [
            node.name,
            node.underlyingType,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        VariableDeclaration,
        (
            node: VariableDeclaration
        ): Specific<ConstructorParameters<typeof VariableDeclaration>> => [
            node.constant,
            node.indexed,
            node.name,
            node.scope,
            node.stateVariable,
            node.storageLocation,
            node.visibility,
            node.mutability,
            node.typeString,
            node.documentation,
            node.vType,
            node.vOverrideSpecifier,
            node.vValue,
            node.nameLocation,
            node.raw
        ]
    ],
    [
        Assignment,
        (node: Assignment): Specific<ConstructorParameters<typeof Assignment>> => [
            node.typeString,
            node.operator,
            node.vLeftHandSide,
            node.vRightHandSide,
            node.raw
        ]
    ],
    [
        BinaryOperation,
        (node: BinaryOperation): Specific<ConstructorParameters<typeof BinaryOperation>> => [
            node.typeString,
            node.operator,
            node.vLeftExpression,
            node.vRightExpression,
            node.userFunction,
            node.raw
        ]
    ],
    [
        Conditional,
        (node: Conditional): Specific<ConstructorParameters<typeof Conditional>> => [
            node.typeString,
            node.vCondition,
            node.vTrueExpression,
            node.vFalseExpression,
            node.raw
        ]
    ],
    [
        ElementaryTypeNameExpression,
        (
            node: ElementaryTypeNameExpression
        ): Specific<ConstructorParameters<typeof ElementaryTypeNameExpression>> => [
            node.typeString,
            node.typeName,
            node.raw
        ]
    ],
    [
        FunctionCallOptions,
        (
            node: FunctionCallOptions
        ): Specific<ConstructorParameters<typeof FunctionCallOptions>> => [
            node.typeString,
            node.vExpression,
            node.vOptionsMap,
            node.raw
        ]
    ],
    [
        FunctionCall,
        (node: FunctionCall): Specific<ConstructorParameters<typeof FunctionCall>> => [
            node.typeString,
            node.kind,
            node.vExpression,
            node.vArguments,
            node.fieldNames,
            node.raw
        ]
    ],
    [
        Identifier,
        (node: Identifier): Specific<ConstructorParameters<typeof Identifier>> => [
            node.typeString,
            node.name,
            node.referencedDeclaration,
            node.raw
        ]
    ],
    [
        IdentifierPath,
        (node: IdentifierPath): Specific<ConstructorParameters<typeof IdentifierPath>> => [
            node.name,
            node.referencedDeclaration,
            node.raw
        ]
    ],
    [
        IndexAccess,
        (node: IndexAccess): Specific<ConstructorParameters<typeof IndexAccess>> => [
            node.typeString,
            node.vBaseExpression,
            node.vIndexExpression,
            node.raw
        ]
    ],
    [
        IndexRangeAccess,
        (node: IndexRangeAccess): Specific<ConstructorParameters<typeof IndexRangeAccess>> => [
            node.typeString,
            node.vBaseExpression,
            node.vStartExpression,
            node.vEndExpression,
            node.raw
        ]
    ],
    [
        Literal,
        (node: Literal): Specific<ConstructorParameters<typeof Literal>> => [
            node.typeString,
            node.kind,
            node.hexValue,
            node.value,
            node.subdenomination,
            node.raw
        ]
    ],
    [
        MemberAccess,
        (node: MemberAccess): Specific<ConstructorParameters<typeof MemberAccess>> => [
            node.typeString,
            node.vExpression,
            node.memberName,
            node.referencedDeclaration,
            node.raw
        ]
    ],
    [
        NewExpression,
        (node: NewExpression): Specific<ConstructorParameters<typeof NewExpression>> => [
            node.typeString,
            node.vTypeName,
            node.raw
        ]
    ],
    [
        TupleExpression,
        (node: TupleExpression): Specific<ConstructorParameters<typeof TupleExpression>> => [
            node.typeString,
            node.isInlineArray,
            node.vOriginalComponents,
            node.raw
        ]
    ],
    [
        UnaryOperation,
        (node: UnaryOperation): Specific<ConstructorParameters<typeof UnaryOperation>> => [
            node.typeString,
            node.prefix,
            node.operator,
            node.vSubExpression,
            node.userFunction,
            node.raw
        ]
    ],
    [
        ImportDirective,
        (node: ImportDirective): Specific<ConstructorParameters<typeof ImportDirective>> => [
            node.file,
            node.absolutePath,
            node.unitAlias,
            node.symbolAliases,
            node.scope,
            node.sourceUnit,
            node.raw
        ]
    ],
    [
        InheritanceSpecifier,
        (
            node: InheritanceSpecifier
        ): Specific<ConstructorParameters<typeof InheritanceSpecifier>> => [
            node.vBaseType,
            node.vArguments,
            node.raw
        ]
    ],
    [
        ModifierInvocation,
        (node: ModifierInvocation): Specific<ConstructorParameters<typeof ModifierInvocation>> => [
            node.vModifierName,
            node.vArguments,
            node.kind,
            node.raw
        ]
    ],
    [
        OverrideSpecifier,
        (node: OverrideSpecifier): Specific<ConstructorParameters<typeof OverrideSpecifier>> => [
            node.vOverrides,
            node.raw
        ]
    ],
    [
        ParameterList,
        (node: ParameterList): Specific<ConstructorParameters<typeof ParameterList>> => [
            node.vParameters,
            node.raw
        ]
    ],
    [
        PragmaDirective,
        (node: PragmaDirective): Specific<ConstructorParameters<typeof PragmaDirective>> => [
            node.literals,
            node.raw
        ]
    ],
    [
        SourceUnit,
        (node: SourceUnit): Specific<ConstructorParameters<typeof SourceUnit>> => [
            node.sourceEntryKey,
            node.sourceListIndex,
            node.absolutePath,
            node.exportedSymbols,
            node.children,
            node.license,
            node.raw
        ]
    ],
    [
        StructuredDocumentation,
        (
            node: StructuredDocumentation
        ): Specific<ConstructorParameters<typeof StructuredDocumentation>> => [node.text, node.raw]
    ],
    [
        UsingForDirective,
        (node: UsingForDirective): Specific<ConstructorParameters<typeof UsingForDirective>> => [
            node.isGlobal,
            node.vLibraryName,
            node.vFunctionList,
            node.vTypeName,
            node.raw
        ]
    ],
    [
        Block,
        (node: Block): Specific<ConstructorParameters<typeof Block>> => [
            node.vStatements,
            node.documentation,
            node.raw
        ]
    ],
    [
        UncheckedBlock,
        (node: UncheckedBlock): Specific<ConstructorParameters<typeof UncheckedBlock>> => [
            node.vStatements,
            node.documentation,
            node.raw
        ]
    ],
    [
        Break,
        (node: Break): Specific<ConstructorParameters<typeof Break>> => [
            node.documentation,
            node.raw
        ]
    ],
    [
        Continue,
        (node: Continue): Specific<ConstructorParameters<typeof Continue>> => [
            node.documentation,
            node.raw
        ]
    ],
    [
        DoWhileStatement,
        (node: DoWhileStatement): Specific<ConstructorParameters<typeof DoWhileStatement>> => [
            node.vCondition,
            node.vBody,
            node.documentation,
            node.raw
        ]
    ],
    [
        EmitStatement,
        (node: EmitStatement): Specific<ConstructorParameters<typeof EmitStatement>> => [
            node.vEventCall,
            node.documentation,
            node.raw
        ]
    ],
    [
        ExpressionStatement,
        (
            node: ExpressionStatement
        ): Specific<ConstructorParameters<typeof ExpressionStatement>> => [
            node.vExpression,
            node.documentation,
            node.raw
        ]
    ],
    [
        ForStatement,
        (node: ForStatement): Specific<ConstructorParameters<typeof ForStatement>> => [
            node.vBody,
            node.vInitializationExpression,
            node.vCondition,
            node.vLoopExpression,
            node.documentation,
            node.raw
        ]
    ],
    [
        IfStatement,
        (node: IfStatement): Specific<ConstructorParameters<typeof IfStatement>> => [
            node.vCondition,
            node.vTrueBody,
            node.vFalseBody,
            node.documentation,
            node.raw
        ]
    ],
    [
        InlineAssembly,
        (node: InlineAssembly): Specific<ConstructorParameters<typeof InlineAssembly>> => [
            node.externalReferences,
            node.operations,
            node.yul,
            node.flags,
            node.evmVersion,
            node.documentation,
            node.raw
        ]
    ],
    [
        PlaceholderStatement,
        (
            node: PlaceholderStatement
        ): Specific<ConstructorParameters<typeof PlaceholderStatement>> => [
            node.documentation,
            node.raw
        ]
    ],
    [
        Return,
        (node: Return): Specific<ConstructorParameters<typeof Return>> => [
            node.functionReturnParameters,
            node.vExpression,
            node.documentation,
            node.raw
        ]
    ],
    [
        RevertStatement,
        (node: RevertStatement): Specific<ConstructorParameters<typeof RevertStatement>> => [
            node.errorCall,
            node.documentation,
            node.raw
        ]
    ],
    [
        Throw,
        (node: Throw): Specific<ConstructorParameters<typeof Throw>> => [
            node.documentation,
            node.raw
        ]
    ],
    [
        TryCatchClause,
        (node: TryCatchClause): Specific<ConstructorParameters<typeof TryCatchClause>> => [
            node.errorName,
            node.vBlock,
            node.vParameters,
            node.documentation,
            node.raw
        ]
    ],
    [
        TryStatement,
        (node: TryStatement): Specific<ConstructorParameters<typeof TryStatement>> => [
            node.vExternalCall,
            node.vClauses,
            node.documentation,
            node.raw
        ]
    ],
    [
        VariableDeclarationStatement,
        (
            node: VariableDeclarationStatement
        ): Specific<ConstructorParameters<typeof VariableDeclarationStatement>> => [
            node.assignments,
            node.vDeclarations,
            node.vInitialValue,
            node.documentation,
            node.raw
        ]
    ],
    [
        WhileStatement,
        (node: WhileStatement): Specific<ConstructorParameters<typeof WhileStatement>> => [
            node.vCondition,
            node.vBody,
            node.documentation,
            node.raw
        ]
    ],
    [
        ArrayTypeName,
        (node: ArrayTypeName): Specific<ConstructorParameters<typeof ArrayTypeName>> => [
            node.typeString,
            node.vBaseType,
            node.vLength,
            node.raw
        ]
    ],
    [
        ElementaryTypeName,
        (node: ElementaryTypeName): Specific<ConstructorParameters<typeof ElementaryTypeName>> => [
            node.typeString,
            node.name,
            node.stateMutability,
            node.raw
        ]
    ],
    [
        FunctionTypeName,
        (node: FunctionTypeName): Specific<ConstructorParameters<typeof FunctionTypeName>> => [
            node.typeString,
            node.visibility,
            node.stateMutability,
            node.vParameterTypes,
            node.vReturnParameterTypes,
            node.raw
        ]
    ],
    [
        Mapping,
        (node: Mapping): Specific<ConstructorParameters<typeof Mapping>> => [
            node.typeString,
            node.vKeyType,
            node.vValueType,
            node.raw
        ]
    ],
    [
        UserDefinedTypeName,
        (
            node: UserDefinedTypeName
        ): Specific<ConstructorParameters<typeof UserDefinedTypeName>> => [
            node.typeString,
            node.name,
            node.referencedDeclaration,
            node.path,
            node.raw
        ]
    ]
]);

export class ASTNodeFactory {
    context: ASTContext;
    postprocessor: ASTPostprocessor;

    private lastId: number;

    constructor(context = new ASTContext(), postprocessor = new ASTPostprocessor()) {
        this.context = context;
        this.postprocessor = postprocessor;

        this.lastId = context.lastId;
    }

    makeContractDefinition(
        ...args: Specific<ConstructorParameters<typeof ContractDefinition>>
    ): ContractDefinition {
        return this.make(ContractDefinition, ...args);
    }

    makeEnumDefinition(
        ...args: Specific<ConstructorParameters<typeof EnumDefinition>>
    ): EnumDefinition {
        return this.make(EnumDefinition, ...args);
    }

    makeEnumValue(...args: Specific<ConstructorParameters<typeof EnumValue>>): EnumValue {
        return this.make(EnumValue, ...args);
    }

    makeErrorDefinition(
        ...args: Specific<ConstructorParameters<typeof ErrorDefinition>>
    ): ErrorDefinition {
        return this.make(ErrorDefinition, ...args);
    }

    makeEventDefinition(
        ...args: Specific<ConstructorParameters<typeof EventDefinition>>
    ): EventDefinition {
        return this.make(EventDefinition, ...args);
    }

    makeFunctionDefinition(
        ...args: Specific<ConstructorParameters<typeof FunctionDefinition>>
    ): FunctionDefinition {
        return this.make(FunctionDefinition, ...args);
    }

    makeModifierDefinition(
        ...args: Specific<ConstructorParameters<typeof ModifierDefinition>>
    ): ModifierDefinition {
        return this.make(ModifierDefinition, ...args);
    }

    makeStructDefinition(
        ...args: Specific<ConstructorParameters<typeof StructDefinition>>
    ): StructDefinition {
        return this.make(StructDefinition, ...args);
    }

    makeUserDefinedValueTypeDefinition(
        ...args: Specific<ConstructorParameters<typeof UserDefinedValueTypeDefinition>>
    ): UserDefinedValueTypeDefinition {
        return this.make(UserDefinedValueTypeDefinition, ...args);
    }

    makeVariableDeclaration(
        ...args: Specific<ConstructorParameters<typeof VariableDeclaration>>
    ): VariableDeclaration {
        return this.make(VariableDeclaration, ...args);
    }

    makeAssignment(...args: Specific<ConstructorParameters<typeof Assignment>>): Assignment {
        return this.make(Assignment, ...args);
    }

    makeBinaryOperation(
        ...args: Specific<ConstructorParameters<typeof BinaryOperation>>
    ): BinaryOperation {
        return this.make(BinaryOperation, ...args);
    }

    makeConditional(...args: Specific<ConstructorParameters<typeof Conditional>>): Conditional {
        return this.make(Conditional, ...args);
    }

    makeElementaryTypeNameExpression(
        ...args: Specific<ConstructorParameters<typeof ElementaryTypeNameExpression>>
    ): ElementaryTypeNameExpression {
        return this.make(ElementaryTypeNameExpression, ...args);
    }

    makeFunctionCallOptions(
        ...args: Specific<ConstructorParameters<typeof FunctionCallOptions>>
    ): FunctionCallOptions {
        return this.make(FunctionCallOptions, ...args);
    }

    makeFunctionCall(...args: Specific<ConstructorParameters<typeof FunctionCall>>): FunctionCall {
        return this.make(FunctionCall, ...args);
    }

    makeIdentifier(...args: Specific<ConstructorParameters<typeof Identifier>>): Identifier {
        return this.make(Identifier, ...args);
    }

    makeIdentifierPath(
        ...args: Specific<ConstructorParameters<typeof IdentifierPath>>
    ): IdentifierPath {
        return this.make(IdentifierPath, ...args);
    }

    makeIndexAccess(...args: Specific<ConstructorParameters<typeof IndexAccess>>): IndexAccess {
        return this.make(IndexAccess, ...args);
    }

    makeIndexRangeAccess(
        ...args: Specific<ConstructorParameters<typeof IndexRangeAccess>>
    ): IndexRangeAccess {
        return this.make(IndexRangeAccess, ...args);
    }

    makeLiteral(...args: Specific<ConstructorParameters<typeof Literal>>): Literal {
        return this.make(Literal, ...args);
    }

    makeMemberAccess(...args: Specific<ConstructorParameters<typeof MemberAccess>>): MemberAccess {
        return this.make(MemberAccess, ...args);
    }

    makeNewExpression(
        ...args: Specific<ConstructorParameters<typeof NewExpression>>
    ): NewExpression {
        return this.make(NewExpression, ...args);
    }

    makePrimaryExpression(
        ...args: Specific<ConstructorParameters<typeof PrimaryExpression>>
    ): PrimaryExpression {
        return this.make(PrimaryExpression, ...args);
    }

    makeTupleExpression(
        ...args: Specific<ConstructorParameters<typeof TupleExpression>>
    ): TupleExpression {
        return this.make(TupleExpression, ...args);
    }

    makeUnaryOperation(
        ...args: Specific<ConstructorParameters<typeof UnaryOperation>>
    ): UnaryOperation {
        return this.make(UnaryOperation, ...args);
    }

    makeImportDirective(
        ...args: Specific<ConstructorParameters<typeof ImportDirective>>
    ): ImportDirective {
        return this.make(ImportDirective, ...args);
    }

    makeInheritanceSpecifier(
        ...args: Specific<ConstructorParameters<typeof InheritanceSpecifier>>
    ): InheritanceSpecifier {
        return this.make(InheritanceSpecifier, ...args);
    }

    makeModifierInvocation(
        ...args: Specific<ConstructorParameters<typeof ModifierInvocation>>
    ): ModifierInvocation {
        return this.make(ModifierInvocation, ...args);
    }

    makeOverrideSpecifier(
        ...args: Specific<ConstructorParameters<typeof OverrideSpecifier>>
    ): OverrideSpecifier {
        return this.make(OverrideSpecifier, ...args);
    }

    makeParameterList(
        ...args: Specific<ConstructorParameters<typeof ParameterList>>
    ): ParameterList {
        return this.make(ParameterList, ...args);
    }

    makePragmaDirective(
        ...args: Specific<ConstructorParameters<typeof PragmaDirective>>
    ): PragmaDirective {
        return this.make(PragmaDirective, ...args);
    }

    makeSourceUnit(...args: Specific<ConstructorParameters<typeof SourceUnit>>): SourceUnit {
        return this.make(SourceUnit, ...args);
    }

    makeStructuredDocumentation(
        ...args: Specific<ConstructorParameters<typeof StructuredDocumentation>>
    ): StructuredDocumentation {
        return this.make(StructuredDocumentation, ...args);
    }

    makeUsingForDirective(
        ...args: Specific<ConstructorParameters<typeof UsingForDirective>>
    ): UsingForDirective {
        return this.make(UsingForDirective, ...args);
    }

    makeBlock(...args: Specific<ConstructorParameters<typeof Block>>): Block {
        return this.make(Block, ...args);
    }

    makeUncheckedBlock(
        ...args: Specific<ConstructorParameters<typeof UncheckedBlock>>
    ): UncheckedBlock {
        return this.make(UncheckedBlock, ...args);
    }

    makeBreak(...args: Specific<ConstructorParameters<typeof Break>>): Break {
        return this.make(Break, ...args);
    }

    makeContinue(...args: Specific<ConstructorParameters<typeof Continue>>): Continue {
        return this.make(Continue, ...args);
    }

    makeDoWhileStatement(
        ...args: Specific<ConstructorParameters<typeof DoWhileStatement>>
    ): DoWhileStatement {
        return this.make(DoWhileStatement, ...args);
    }

    makeEmitStatement(
        ...args: Specific<ConstructorParameters<typeof EmitStatement>>
    ): EmitStatement {
        return this.make(EmitStatement, ...args);
    }

    makeExpressionStatement(
        ...args: Specific<ConstructorParameters<typeof ExpressionStatement>>
    ): ExpressionStatement {
        return this.make(ExpressionStatement, ...args);
    }

    makeForStatement(...args: Specific<ConstructorParameters<typeof ForStatement>>): ForStatement {
        return this.make(ForStatement, ...args);
    }

    makeIfStatement(...args: Specific<ConstructorParameters<typeof IfStatement>>): IfStatement {
        return this.make(IfStatement, ...args);
    }

    makeInlineAssembly(
        ...args: Specific<ConstructorParameters<typeof InlineAssembly>>
    ): InlineAssembly {
        return this.make(InlineAssembly, ...args);
    }

    makePlaceholderStatement(
        ...args: Specific<ConstructorParameters<typeof PlaceholderStatement>>
    ): PlaceholderStatement {
        return this.make(PlaceholderStatement, ...args);
    }

    makeReturn(...args: Specific<ConstructorParameters<typeof Return>>): Return {
        return this.make(Return, ...args);
    }

    makeRevertStatement(
        ...args: Specific<ConstructorParameters<typeof RevertStatement>>
    ): RevertStatement {
        return this.make(RevertStatement, ...args);
    }

    makeThrow(...args: Specific<ConstructorParameters<typeof Throw>>): Throw {
        return this.make(Throw, ...args);
    }

    makeTryCatchClause(
        ...args: Specific<ConstructorParameters<typeof TryCatchClause>>
    ): TryCatchClause {
        return this.make(TryCatchClause, ...args);
    }

    makeTryStatement(...args: Specific<ConstructorParameters<typeof TryStatement>>): TryStatement {
        return this.make(TryStatement, ...args);
    }

    makeVariableDeclarationStatement(
        ...args: Specific<ConstructorParameters<typeof VariableDeclarationStatement>>
    ): VariableDeclarationStatement {
        return this.make(VariableDeclarationStatement, ...args);
    }

    makeWhileStatement(
        ...args: Specific<ConstructorParameters<typeof WhileStatement>>
    ): WhileStatement {
        return this.make(WhileStatement, ...args);
    }

    makeArrayTypeName(
        ...args: Specific<ConstructorParameters<typeof ArrayTypeName>>
    ): ArrayTypeName {
        return this.make(ArrayTypeName, ...args);
    }

    makeElementaryTypeName(
        ...args: Specific<ConstructorParameters<typeof ElementaryTypeName>>
    ): ElementaryTypeName {
        return this.make(ElementaryTypeName, ...args);
    }

    makeFunctionTypeName(
        ...args: Specific<ConstructorParameters<typeof FunctionTypeName>>
    ): FunctionTypeName {
        return this.make(FunctionTypeName, ...args);
    }

    makeMapping(...args: Specific<ConstructorParameters<typeof Mapping>>): Mapping {
        return this.make(Mapping, ...args);
    }

    makeUserDefinedTypeName(
        ...args: Specific<ConstructorParameters<typeof UserDefinedTypeName>>
    ): UserDefinedTypeName {
        return this.make(UserDefinedTypeName, ...args);
    }

    makeIdentifierFor(
        target:
            | VariableDeclaration
            | ContractDefinition
            | FunctionDefinition
            | StructDefinition
            | ErrorDefinition
            | EventDefinition
            | EnumDefinition
            | UserDefinedValueTypeDefinition
            | ImportDirective
    ): Identifier {
        let typeString: string;

        if (target instanceof VariableDeclaration) {
            typeString = target.typeString;
        } else if (target instanceof FunctionDefinition) {
            const args = target.vParameters.vParameters.map(this.typeExtractor);

            const result = [`function (${args.join(",")})`];

            if (target.stateMutability !== FunctionStateMutability.NonPayable) {
                result.push(target.stateMutability);
            }

            if (target.visibility !== FunctionVisibility.Public) {
                result.push(target.visibility);
            }

            if (target.vReturnParameters.vParameters.length) {
                const rets = target.vReturnParameters.vParameters.map(this.typeExtractor);

                result.push(`returns (${rets.join(",")})`);
            }

            typeString = result.join(" ");
        } else if (target instanceof ContractDefinition) {
            typeString = `type(contract ${target.name})`;
        } else if (target instanceof StructDefinition) {
            typeString = `type(struct ${target.canonicalName} storage pointer)`;
        } else if (target instanceof EnumDefinition) {
            typeString = `type(enum ${target.canonicalName})`;
        } else if (target instanceof UserDefinedValueTypeDefinition) {
            typeString = `type(${target.canonicalName})`;
        } else if (target instanceof EventDefinition || target instanceof ErrorDefinition) {
            const args = target.vParameters.vParameters.map(this.typeExtractor);

            typeString = `function (${args.join(",")})`;
        } else if (target instanceof ImportDirective) {
            typeString = "<missing>";

            if (target.unitAlias === "") {
                throw new Error('Target ImportDirective required to have valid "unitAlias"');
            }
        } else {
            throw new Error(
                "ASTNodeFactory.makeIdentifierFor(): Unable to compose typeString for supplied target"
            );
        }

        return this.makeIdentifier(
            typeString,
            target instanceof ImportDirective ? target.unitAlias : target.name,
            target.id
        );
    }

    makeUnfinalized<T extends ASTNode>(
        type: ASTNodeConstructor<T>,
        ...args: Specific<ConstructorParameters<typeof type>>
    ): T {
        const node = new type(++this.lastId, "0:0:0", ...args);

        this.context.register(node);

        return node;
    }

    make<T extends ASTNode>(
        type: ASTNodeConstructor<T>,
        ...args: Specific<ConstructorParameters<typeof type>>
    ): T {
        const node = this.makeUnfinalized(type, ...args);

        this.postprocessor.processNode(node, this.context);

        return node;
    }

    copy<T extends ASTNode>(node: T): T {
        const cache = new Map<number, number>();
        const clone = this.copyHelper(node, cache);
        const context = this.context;
        const postprocessor = this.postprocessor;

        for (const child of clone.getChildren(true)) {
            this.patchIds(child, cache);

            postprocessor.processNode(child, context);
        }

        return clone;
    }

    private patchIds(node: ASTNode, cache: IDMap): void {
        const patch = (oldId: number): number => {
            const newId = cache.get(oldId);

            return newId === undefined ? oldId : newId;
        };

        if (
            node instanceof ContractDefinition ||
            node instanceof FunctionDefinition ||
            node instanceof StructDefinition ||
            node instanceof VariableDeclaration ||
            node instanceof ImportDirective
        ) {
            node.scope = patch(node.scope);
        }

        if (node instanceof ContractDefinition) {
            node.linearizedBaseContracts = node.linearizedBaseContracts.map(patch);
            node.usedErrors = node.usedErrors.map(patch);
        }

        if (
            node instanceof Identifier ||
            node instanceof IdentifierPath ||
            node instanceof MemberAccess ||
            node instanceof UserDefinedTypeName
        ) {
            node.referencedDeclaration = patch(node.referencedDeclaration);
        }

        if (node instanceof ImportDirective) {
            node.sourceUnit = patch(node.sourceUnit);
        }

        if (node instanceof SourceUnit) {
            const m = new Map<string, number>();

            for (const [k, v] of node.exportedSymbols) {
                m.set(k, patch(v));
            }

            node.exportedSymbols = m;
        }

        if (
            (node instanceof UnaryOperation || node instanceof BinaryOperation) &&
            node.userFunction
        ) {
            node.userFunction = patch(node.userFunction);
        }

        if (node instanceof VariableDeclarationStatement) {
            node.assignments = node.assignments.map((id) => (id === null ? id : patch(id)));
        }
    }

    private copyHelper<T extends ASTNode>(node: T, cache: IDMap): T {
        const ctor = node.constructor as ASTNodeConstructor<T>;
        const extractor = argExtractionMapping.get(ctor);

        if (extractor === undefined) {
            throw new Error(`Unable to find extractor for node constructor ${ctor.name}`);
        }

        const args = extractor(node).map((arg) => this.copyValue(arg, cache));
        const clone = this.makeUnfinalized(ctor, ...args);

        cache.set(node.id, clone.id);

        return clone;
    }

    private copyValue(value: any, cache: IDMap): any {
        if (value === null || value === undefined) {
            return value;
        }

        if (["string", "number", "bigint", "boolean"].includes(typeof value)) {
            return value;
        }

        if (value instanceof ASTContext) {
            return value;
        }

        if (value instanceof ASTNode) {
            return this.copyHelper(value, cache);
        }

        if (value instanceof Array) {
            return value.map((v) =>
                v instanceof ASTNode ? this.copyHelper(v, cache) : this.copyValue(v, cache)
            );
        }

        if (value instanceof Map) {
            const m = new Map();

            for (const [k, v] of value) {
                m.set(
                    k instanceof ASTNode ? this.copyHelper(k, cache) : this.copyValue(k, cache),
                    v instanceof ASTNode ? this.copyHelper(v, cache) : this.copyValue(v, cache)
                );
            }

            return m;
        }

        if (typeof value === "object") {
            const o: { [property: string]: any } = {};
            const hasProperty = Object.hasOwnProperty;

            for (const p in value) {
                if (hasProperty.call(value, p)) {
                    o[p] = this.copyValue(value[p], cache);
                }
            }

            return o;
        }

        throw new Error(`Cannot copy value ${JSON.stringify(value)} of type ${typeof value}`);
    }

    private typeExtractor(arg: VariableDeclaration): string {
        return arg.typeString;
    }
}
