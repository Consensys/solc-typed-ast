import { gte, satisfies } from "semver";
import { ASTNode, ASTNodeConstructor } from "../ast_node";
import {
    DataLocation,
    FunctionKind,
    FunctionStateMutability,
    LiteralKind,
    Mutability,
    StateVariableVisibility
} from "../constants";
import {
    ContractDefinition,
    EnumDefinition,
    EnumValue,
    EventDefinition,
    FunctionDefinition,
    ModifierDefinition,
    StructDefinition,
    VariableDeclaration
} from "../implementation/declaration";
import {
    Assignment,
    BinaryOperation,
    Conditional,
    ElementaryTypeNameExpression,
    FunctionCall,
    FunctionCallOptions,
    Identifier,
    IndexAccess,
    IndexRangeAccess,
    Literal,
    MemberAccess,
    NewExpression,
    TupleExpression,
    UnaryOperation
} from "../implementation/expression";
import {
    IdentifierPath,
    ImportDirective,
    InheritanceSpecifier,
    ModifierInvocation,
    OverrideSpecifier,
    ParameterList,
    PragmaDirective,
    SourceUnit,
    StructuredDocumentation,
    UsingForDirective
} from "../implementation/meta";
import {
    Block,
    Break,
    Continue,
    DoWhileStatement,
    EmitStatement,
    ExpressionStatement,
    ForStatement,
    IfStatement,
    InlineAssembly,
    PlaceholderStatement,
    Return,
    Statement,
    Throw,
    TryCatchClause,
    TryStatement,
    UncheckedBlock,
    VariableDeclarationStatement,
    WhileStatement
} from "../implementation/statement";
import {
    ArrayTypeName,
    ElementaryTypeName,
    FunctionTypeName,
    Mapping,
    UserDefinedTypeName
} from "../implementation/type";
import { SourceFormatter } from "./formatter";
import { ASTNodeWriter, ASTWriter, DescArgs, SrcDesc, YulWriter } from "./writer";
import { DefaultYulWriterMapping } from "./yul_mapping";

type DocumentedNode =
    | ContractDefinition
    | VariableDeclaration
    | FunctionDefinition
    | ModifierDefinition
    | EventDefinition;

type CompoundStatement = IfStatement | ForStatement | WhileStatement;

const RX_SPACE_OR_EMPTY = /^\s*$/;

function descTrimRight(desc: SrcDesc): void {
    while (desc.length > 0) {
        const last = desc[desc.length - 1];

        if (typeof last === "string") {
            if (RX_SPACE_OR_EMPTY.test(last)) {
                desc.pop();

                continue;
            }
        } else {
            descTrimRight(last[1]);
        }

        break;
    }
}

/**
 * A small hack to handle semicolons in the last statement of compound statements like if and while. Given:
 *
 * ```
 * if (cond) x++;
 * ```
 *
 * The last semicolon belongs to the SrcDesc of the true body of the if. This function would move it from that SrcDesc
 * to the end of the top-level SrcDesc of the if statement. This way we can more easily exclude semicolons from the src range of
 * compound statements like ifs.
 */
function pushSemicolonsDown(desc: SrcDesc): void {
    if (desc.length === 0) return;

    const last = desc[desc.length - 1];

    if (typeof last === "string") {
        return;
    }

    if (last[1].length === 0) {
        return;
    }

    const lastLast = last[1][last[1].length - 1];

    if (lastLast === ";") {
        last[1].pop();

        desc.push(";");
    }
}

function wrapCompoundStatement(
    node: IfStatement | WhileStatement | ForStatement,
    desc: SrcDesc
): SrcDesc {
    const last = desc[desc.length - 1];

    if (last !== ";") {
        return [[node, desc]];
    }

    return [[node, desc.slice(0, -1)], ";"];
}

function join<T1, T2>(arr: readonly T1[], join: T2): Array<T1 | T2> {
    const result: Array<T1 | T2> = [];

    for (let i = 0; i < arr.length; i++) {
        result.push(arr[i]);

        if (i !== arr.length - 1) {
            result.push(join);
        }
    }

    return result;
}

function flatJoin<T1, T2>(arr: T1[][], join: T2): Array<T1 | T2> {
    const result: Array<T1 | T2> = [];

    for (let i = 0; i < arr.length; i++) {
        result.push(...arr[i]);

        if (i !== arr.length - 1) {
            result.push(join);
        }
    }

    return result;
}

function flatten<T>(arr: T[][]): T[] {
    const result: T[] = [];

    for (let i = 0; i < arr.length; i++) {
        result.push(...arr[i]);
    }

    return result;
}

/**
 * Determine if a given unary/binary/conditional expression needs to be surrounded
 * by parenthesis to clarify order of evaluation.
 */
function needsParenthesis(e: UnaryOperation | BinaryOperation | Conditional): boolean {
    return (
        e.parent instanceof UnaryOperation ||
        e.parent instanceof BinaryOperation ||
        e.parent instanceof Conditional
    );
}

class ElementaryTypeNameWriter extends ASTNodeWriter {
    writeInner(node: ElementaryTypeName, writer: ASTWriter): SrcDesc {
        if (satisfies(writer.targetCompilerVersion, "0.4")) {
            return [node.name];
        }

        if (
            gte(writer.targetCompilerVersion, "0.6.0") &&
            node.name === "address" &&
            node.parent instanceof ElementaryTypeNameExpression
        ) {
            return [node.stateMutability === "payable" ? "payable" : "address"];
        }

        return [node.stateMutability === "payable" ? node.name + " payable" : node.name];
    }
}

class ArrayTypeNameWriter extends ASTNodeWriter {
    writeInner(node: ArrayTypeName, writer: ASTWriter): SrcDesc {
        if (node.vLength) {
            return writer.desc(node.vBaseType, "[", node.vLength, "]");
        }

        return writer.desc(node.vBaseType, "[]");
    }
}

class MappingTypeNameWriter extends ASTNodeWriter {
    writeInner(node: Mapping, writer: ASTWriter): SrcDesc {
        return writer.desc("mapping(", node.vKeyType, " => ", node.vValueType, ")");
    }
}

class UserDefinedTypeNameWriter extends ASTNodeWriter {
    writeInner(node: UserDefinedTypeName, writer: ASTWriter): SrcDesc {
        if (node.path) {
            return writer.desc(node.path);
        }

        if (node.name === undefined) {
            throw new Error(
                "Unable to detect name of user-defined type reference node: " + node.print()
            );
        }

        return [node.name];
    }
}

class IdentifierPathWriter extends ASTNodeWriter {
    writeInner(node: IdentifierPath): SrcDesc {
        return [node.name];
    }
}

class FunctionTypeNameWriter extends ASTNodeWriter {
    writeInner(node: FunctionTypeName, writer: ASTWriter): SrcDesc {
        const elements = ["function", node.vParameterTypes, ` ${node.visibility}`];

        if (node.stateMutability !== FunctionStateMutability.NonPayable) {
            elements.push(" " + node.stateMutability);
        }

        if (node.vReturnParameterTypes.vParameters.length) {
            elements.push(` returns `, node.vReturnParameterTypes);
        }

        return writer.desc(...elements);
    }
}

class LiteralWriter extends ASTNodeWriter {
    writeInner(node: Literal): SrcDesc {
        if (node.kind === LiteralKind.String) {
            return [
                node.value === null ? 'hex"' + node.hexValue + '"' : JSON.stringify(node.value)
            ];
        }

        if (node.kind === LiteralKind.HexString) {
            return ['hex"' + node.hexValue + '"'];
        }

        if (node.kind === LiteralKind.UnicodeString) {
            return ['unicode"' + node.value + '"'];
        }

        let result = node.value;

        if (node.subdenomination !== undefined) {
            result += " " + node.subdenomination;
        }

        return [result];
    }
}

class IdentifierWriter extends ASTNodeWriter {
    writeInner(node: Identifier): SrcDesc {
        return [node.name];
    }
}

class FunctionCallOptionsWriter extends ASTNodeWriter {
    writeInner(node: FunctionCallOptions, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [node.vExpression, "{"];

        elements.push(
            ...flatJoin(
                [...node.vOptionsMap.entries()].map(([name, value]) => [name, ": ", value]),
                ", "
            )
        );

        elements.push("}");

        return writer.desc(...elements);
    }
}

class FunctionCallWriter extends ASTNodeWriter {
    writeInner(node: FunctionCall, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [node.vExpression, "(", ...join(node.vArguments, ", "), ")"];

        return writer.desc(...elements);
    }
}

class MemberAccessWriter extends ASTNodeWriter {
    writeInner(node: MemberAccess, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vExpression, `.${node.memberName}`);
    }
}

class IndexAccessWriter extends ASTNodeWriter {
    writeInner(node: IndexAccess, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vBaseExpression, "[", node.vIndexExpression, "]");
    }
}

class IndexRangeAccessWriter extends ASTNodeWriter {
    writeInner(node: IndexRangeAccess, writer: ASTWriter): SrcDesc {
        return writer.desc(
            node.vBaseExpression,
            "[",
            node.vStartExpression,
            ":",
            node.vEndExpression,
            "]"
        );
    }
}

class UnaryOperationWriter extends ASTNodeWriter {
    writeInner(node: UnaryOperation, writer: ASTWriter): SrcDesc {
        if (node.operator === "delete") {
            return writer.desc("delete ", node.vSubExpression);
        }

        const elements: DescArgs = [node.vSubExpression];
        if (node.prefix) {
            elements.unshift(node.operator);
        } else {
            elements.push(node.operator);
        }

        if (needsParenthesis(node)) {
            elements.unshift("(");
            elements.push(")");
        }

        return writer.desc(...elements);
    }
}

class BinaryOperationWriter extends ASTNodeWriter {
    writeInner(node: BinaryOperation, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [
            node.vLeftExpression,
            ` ${node.operator} `,
            node.vRightExpression
        ];

        if (needsParenthesis(node)) {
            elements.unshift("(");
            elements.push(")");
        }

        return writer.desc(...elements);
    }
}

class ConditionalWriter extends ASTNodeWriter {
    writeInner(node: Conditional, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [
            node.vCondition,
            " ? ",
            node.vTrueExpression,
            " : ",
            node.vFalseExpression
        ];

        if (needsParenthesis(node)) {
            elements.unshift("(");
            elements.push(")");
        }

        return writer.desc(...elements);
    }
}

class AssignmentWriter extends ASTNodeWriter {
    writeInner(node: Assignment, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vLeftHandSide, ` ${node.operator} `, node.vRightHandSide);
    }
}

class ElementaryTypeNameExpressionWriter extends ASTNodeWriter {
    writeInner(node: ElementaryTypeNameExpression, writer: ASTWriter): SrcDesc {
        return writer.desc(node.typeName);
    }
}

class NewExpressionWriter extends ASTNodeWriter {
    writeInner(node: NewExpression, writer: ASTWriter): SrcDesc {
        return writer.desc("new ", node.vTypeName);
    }
}

class TupleExpressionWriter extends ASTNodeWriter {
    writeInner(node: TupleExpression, writer: ASTWriter): SrcDesc {
        if (node.isInlineArray) {
            return writer.desc("[", ...join(node.vOriginalComponents, ", "), "]");
        }

        return writer.desc("(", ...join(node.vOriginalComponents, ", "), ")");
    }
}

/**
 * For most statements we don't want to include the ";" in the
 * source map range.
 */
abstract class SimpleStatementWriter<T extends Statement> extends ASTNodeWriter {
    writeWhole(node: T, writer: ASTWriter): SrcDesc {
        return [[node, this.writeInner(node, writer)], ";"];
    }
}

class ExpressionStatementWriter extends SimpleStatementWriter<ExpressionStatement> {
    writeInner(node: ExpressionStatement, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vExpression);
    }

    /**
     * For ExpressionStatements we want to omit the semicolon when
     * they are a part of vLoopExpression of a for statement.
     */
    writeWhole(node: ExpressionStatement, writer: ASTWriter): SrcDesc {
        const stmtDesc: SrcDesc = [[node, this.writeInner(node, writer)]];

        if (!(node.parent instanceof ForStatement && node.parent.vLoopExpression === node)) {
            stmtDesc.push(";");
        }

        return stmtDesc;
    }
}

class VariableDeclarationStatementWriter extends SimpleStatementWriter<VariableDeclarationStatement> {
    writeInner(node: VariableDeclarationStatement, writer: ASTWriter): SrcDesc {
        const elements = this.getDeclarations(node);

        if (node.vInitialValue) {
            elements.push(" = ", node.vInitialValue);
        }

        return writer.desc(...elements);
    }

    private getDeclarations(node: VariableDeclarationStatement): DescArgs {
        const assignments = node.assignments;
        const children = node.children;

        if (assignments.length < 2 || assignments.every((id) => id === null)) {
            const declaration = node.vDeclarations[0];

            return declaration.vType === undefined ? ["var ", declaration] : [declaration];
        }

        const declarations: DescArgs = join(
            assignments.map((id) => {
                if (id === null) {
                    return "";
                }

                const declaration = children.find((c) => c.id === id);

                if (!declaration) {
                    throw new Error(
                        `Unable to find assigned declaration ${id} in children of ${node.print()}`
                    );
                }

                return declaration;
            }),
            ", "
        );

        const tuple: DescArgs = ["(", ...declarations, ")"];

        const isUntyped = node.vDeclarations.every(
            (declaration) => declaration.vType === undefined
        );

        if (isUntyped) {
            tuple.unshift("var ");
        }

        return tuple;
    }
}

/**
 * Compound statemetns don't have their own semicolons. However if a
 * child has a semi-colon, we must make sure to exclude it from our soruce map.
 */
abstract class CompoundStatementWriter<
    T extends CompoundStatement
> extends SimpleStatementWriter<T> {
    writeWhole(node: T, writer: ASTWriter): SrcDesc {
        const stmtDesc = this.writeInner(node, writer);

        pushSemicolonsDown(stmtDesc);

        return wrapCompoundStatement(node, stmtDesc);
    }
}

class IfStatementWriter extends CompoundStatementWriter<IfStatement> {
    writeInner(node: IfStatement, writer: ASTWriter): SrcDesc {
        if (node.vFalseBody) {
            return writer.desc(
                "if (",
                node.vCondition,
                ") ",
                node.vTrueBody,
                " else ",
                node.vFalseBody
            );
        }

        return writer.desc("if (", node.vCondition, ") ", node.vTrueBody);
    }
}

class ForStatementWriter extends CompoundStatementWriter<ForStatement> {
    writeInner(node: ForStatement, writer: ASTWriter): SrcDesc {
        return writer.desc(
            "for (",
            ...(node.vInitializationExpression === undefined
                ? ["; "]
                : [node.vInitializationExpression, " "]),
            node.vCondition,
            "; ",
            node.vLoopExpression,
            ") ",
            node.vBody
        );
    }
}

class WhileStatementWriter extends CompoundStatementWriter<WhileStatement> {
    writeInner(node: WhileStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("while (", node.vCondition, ") ", node.vBody);
    }
}

class DoWhileStatementWriter extends SimpleStatementWriter<DoWhileStatement> {
    writeInner(node: DoWhileStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("do ", node.vBody, " while(", node.vCondition, ")");
    }
}

class ReturnWriter extends SimpleStatementWriter<Return> {
    writeInner(node: Return, writer: ASTWriter): SrcDesc {
        if (node.vExpression) {
            return writer.desc("return ", node.vExpression);
        }

        return ["return"];
    }
}

class BreakWriter extends SimpleStatementWriter<Break> {
    writeInner(): SrcDesc {
        return ["break"];
    }
}

class ContinueWriter extends SimpleStatementWriter<Continue> {
    writeInner(): SrcDesc {
        return ["continue"];
    }
}

class ThrowWriter extends SimpleStatementWriter<Throw> {
    writeInner(): SrcDesc {
        return ["throw"];
    }
}

class EmitStatementWriter extends SimpleStatementWriter<EmitStatement> {
    writeInner(node: EmitStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("emit ", node.vEventCall);
    }
}

class PlaceholderStatementWriter extends SimpleStatementWriter<PlaceholderStatement> {
    writeInner(): SrcDesc {
        return ["_"];
    }
}

class InlineAssemblyWriter extends ASTNodeWriter {
    writeInner(node: InlineAssembly, writer: ASTWriter): SrcDesc {
        let yul: string | undefined;

        if (node.operations !== undefined) {
            yul = node.operations;
        }

        if (node.yul !== undefined) {
            const yulWriter = new YulWriter(DefaultYulWriterMapping, writer.formatter);

            yul = yulWriter.write(node.yul);
        }

        if (yul === undefined) {
            throw new Error("Unable to detect Yul data in inline assembly node: " + node.print());
        }

        return ["assembly " + yul];
    }
}

class TryCatchClauseWriter extends ASTNodeWriter {
    writeInner(node: TryCatchClause, writer: ASTWriter): SrcDesc {
        // Success clause (always the first child of the try-catch after the call)
        if (node.previousSibling instanceof FunctionCall) {
            if (node.vParameters === undefined || node.vParameters.vParameters.length === 0) {
                return writer.desc(node.vBlock);
            }

            return writer.desc("returns ", node.vParameters, " ", node.vBlock);
        }

        // Error clause
        return writer.desc("catch ", node.errorName, node.vParameters, " ", node.vBlock);
    }
}

class TryStatementWriter extends ASTNodeWriter {
    writeInner(node: TryStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("try ", node.vExternalCall, " ", ...join(node.vClauses, " "));
    }
}

class StructuredDocumentationWriter extends ASTNodeWriter {
    static render(text: string, formatter: SourceFormatter): string {
        const indent = formatter.renderIndent();
        const prefix = "/// ";

        const documentation = text.replace(/\n/g, (sub) => sub + indent + prefix);

        return prefix + documentation + "\n" + indent;
    }

    writeInner(node: StructuredDocumentation, writer: ASTWriter): SrcDesc {
        return [StructuredDocumentationWriter.render(node.text, writer.formatter)];
    }
}

abstract class DocumentedNodeWriter<T extends DocumentedNode> extends ASTNodeWriter {
    writeWhole(node: T, writer: ASTWriter): SrcDesc {
        const nodeDesc: SrcDesc = [[node, this.writeInner(node, writer)]];

        if (node.documentation) {
            if (node.documentation instanceof StructuredDocumentation) {
                nodeDesc.unshift(...writer.desc(node.documentation));
            } else {
                nodeDesc.unshift(
                    StructuredDocumentationWriter.render(node.documentation, writer.formatter)
                );
            }
        }

        return nodeDesc;
    }
}

class VariableDeclarationWriter extends DocumentedNodeWriter<VariableDeclaration> {
    writeInner(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
        if (node.vScope instanceof SourceUnit) {
            return this.getUnitConstant(node, writer);
        }

        return node.stateVariable
            ? this.getStateVariable(node, writer)
            : this.getLocalVariable(node, writer);
    }

    private getUnitConstant(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
        if (!(node.vType && node.vValue && node.mutability === Mutability.Constant)) {
            throw new Error("Malformed unit-level constant variable: " + node.print());
        }

        return writer.desc(node.vType, " ", node.mutability, " ", node.name, " = ", node.vValue);
    }

    private getStateVariable(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
        if (!node.vType) {
            throw new Error("Unexpected untyped state variable: " + node.print());
        }

        const elements: DescArgs = [node.vType];

        if (node.visibility !== StateVariableVisibility.Default) {
            elements.push(" ", node.visibility);
        }

        if (node.mutability !== Mutability.Mutable) {
            elements.push(" ", node.mutability);
        }

        if (node.vOverrideSpecifier) {
            elements.push(" ", node.vOverrideSpecifier);
        }

        elements.push(" ", node.name);

        if (node.vValue) {
            elements.push(" = ", node.vValue);
        }

        return writer.desc(...elements);
    }

    private getLocalVariable(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [];

        if (node.vType) {
            elements.push(node.vType);
        }

        if (node.storageLocation !== DataLocation.Default) {
            elements.push(node.storageLocation);
        }

        if (node.indexed) {
            elements.push("indexed");
        }

        if (node.name !== "") {
            elements.push(node.name);
        }

        return writer.desc(...join(elements, " "));
    }
}

class ParameterListWriter extends ASTNodeWriter {
    writeInner(node: ParameterList, writer: ASTWriter): SrcDesc {
        return [
            "(",
            ...flatJoin<string | [ASTNode, any[]], string>(
                node.vParameters.map((vDecl) => writer.desc(vDecl)),
                ", "
            ),
            ")"
        ];
    }
}

class BlockWriter extends ASTNodeWriter {
    writeInner(node: Block, writer: ASTWriter): SrcDesc {
        if (node.children.length === 0) {
            return ["{}"];
        }

        const formatter = writer.formatter;
        const wrap = formatter.renderWrap();
        const oldIndent = formatter.renderIndent();

        formatter.increaseNesting();

        const res: SrcDesc = [
            "{",
            wrap,
            ...flatJoin(
                node.children.map<SrcDesc>((stmt) => [
                    formatter.renderIndent(),
                    ...writer.desc(stmt)
                ]),
                wrap
            ),
            wrap,
            oldIndent,
            "}"
        ];

        formatter.decreaseNesting();

        return res;
    }
}

class UncheckedBlockWriter extends ASTNodeWriter {
    writeInner(node: UncheckedBlock, writer: ASTWriter): SrcDesc {
        if (node.children.length === 0) {
            return ["unchecked {}"];
        }

        const formatter = writer.formatter;
        const wrap = formatter.renderWrap();
        const oldIndent = formatter.renderIndent();

        formatter.increaseNesting();

        const res: SrcDesc = [
            "unchecked {",
            wrap,
            ...flatJoin(
                node.children.map<SrcDesc>((stmt) => [
                    formatter.renderIndent(),
                    ...writer.desc(stmt)
                ]),
                wrap
            ),
            wrap,
            oldIndent,
            "}"
        ];

        formatter.decreaseNesting();

        return res;
    }
}

class EventDefinitionWriter extends DocumentedNodeWriter<EventDefinition> {
    writeInner(node: EventDefinition, writer: ASTWriter): SrcDesc {
        return writer.desc(
            "event ",
            node.name,
            node.vParameters,
            node.anonymous ? " anonymous" : "",
            ";"
        );
    }
}

class StructDefinitionWriter extends ASTNodeWriter {
    writeInner(node: StructDefinition, writer: ASTWriter): SrcDesc {
        return ["struct ", node.name, " ", ...this.getBody(node, writer)];
    }

    private getBody(node: StructDefinition, writer: ASTWriter): SrcDesc {
        if (node.vMembers.length === 0) {
            return ["{}"];
        }

        const formatter = writer.formatter;
        const wrap = formatter.renderWrap();
        const currentIndent = formatter.renderIndent();

        formatter.increaseNesting();

        const nestedIndent = formatter.renderIndent();

        formatter.decreaseNesting();

        return [
            "{",
            wrap,
            ...flatJoin(
                node.vMembers.map((vDecl) => [nestedIndent, ...writer.desc(vDecl), ";"]),
                wrap
            ),
            wrap,
            currentIndent,
            "}"
        ];
    }
}

class ModifierDefinitionWriter extends DocumentedNodeWriter<ModifierDefinition> {
    writeInner(node: ModifierDefinition, writer: ASTWriter): SrcDesc {
        const args: DescArgs = ["modifier ", node.name, node.vParameters];

        if (gte(writer.targetCompilerVersion, "0.6.0")) {
            if (node.virtual) {
                args.push(" virtual");
            }

            if (node.vOverrideSpecifier) {
                args.push(" ", node.vOverrideSpecifier);
            }
        }

        if (node.vBody) {
            args.push(" ", node.vBody);
        } else {
            args.push(";");
        }

        return writer.desc(...args);
    }
}

class ModifierInvocationWriter extends ASTNodeWriter {
    writeInner(node: ModifierInvocation, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vModifierName, "(", ...join(node.vArguments, ","), ")");
    }
}

class OverrideSpecifierWriter extends ASTNodeWriter {
    writeInner(node: OverrideSpecifier, writer: ASTWriter): SrcDesc {
        if (node.vOverrides.length) {
            return writer.desc("override", "(", ...join(node.vOverrides, ", "), ")");
        }

        return ["override"];
    }
}

class FunctionDefinitionWriter extends DocumentedNodeWriter<FunctionDefinition> {
    writeInner(node: FunctionDefinition, writer: ASTWriter): SrcDesc {
        const args = this.getHeader(node, writer);

        if (!node.vBody) {
            return writer.desc(...args, ";");
        }

        const result = writer.desc(...args);

        result.push(" ", ...writer.desc(node.vBody));

        return result;
    }

    private getHeader(node: FunctionDefinition, writer: ASTWriter): DescArgs {
        const isGte06 = gte(writer.targetCompilerVersion, "0.6.0");
        const isGte07 = gte(writer.targetCompilerVersion, "0.7.0");

        const isFileLevel = node.kind === FunctionKind.Free;

        let name: string;

        if (isGte06) {
            name =
                node.kind === FunctionKind.Function || isFileLevel
                    ? `function ${node.name}`
                    : node.kind;
        } else {
            name = node.isConstructor && node.name === "" ? "constructor" : `function ${node.name}`;
        }

        const result: DescArgs = [name, node.vParameters];

        if (isGte06) {
            if (node.virtual) {
                result.push(" virtual");
            }

            if (node.vOverrideSpecifier) {
                result.push(" ", node.vOverrideSpecifier);
            }
        }

        if (!((isGte07 && node.isConstructor) || isFileLevel)) {
            result.push(" ", node.visibility);
        }

        if (node.stateMutability !== FunctionStateMutability.NonPayable) {
            result.push(" ", node.stateMutability);
        }

        if (node.vModifiers.length) {
            result.push(" ", ...join(node.vModifiers, " "));
        }

        if (node.vReturnParameters.vParameters.length) {
            result.push(" returns ", node.vReturnParameters);
        }

        return result;
    }
}

class UsingForDirectiveWriter extends ASTNodeWriter {
    writeInner(node: UsingForDirective, writer: ASTWriter): SrcDesc {
        return writer.desc(
            "using ",
            node.vLibraryName,
            " for ",
            node.vTypeName ? node.vTypeName : "*",
            ";"
        );
    }
}

class EnumValueWriter extends ASTNodeWriter {
    writeInner(node: EnumValue): SrcDesc {
        return [node.name];
    }
}

class EnumDefinitionWriter extends ASTNodeWriter {
    writeInner(node: EnumDefinition, writer: ASTWriter): SrcDesc {
        return writer.desc("enum ", node.name, " ", "{ ", ...join(node.vMembers, ", "), " }");
    }
}

class InheritanceSpecifierWriter extends ASTNodeWriter {
    writeInner(node: InheritanceSpecifier, writer: ASTWriter): SrcDesc {
        const args: DescArgs = [node.vBaseType];

        if (node.vArguments.length) {
            args.push("(", ...join(node.vArguments, ", "), ")");
        }

        return writer.desc(...args);
    }
}

class ContractDefinitionWriter extends DocumentedNodeWriter<ContractDefinition> {
    writeInner(node: ContractDefinition, writer: ASTWriter): SrcDesc {
        const headerArgs = this.getHeader(node, writer);
        const headerDesc = writer.desc(...headerArgs);

        const bodyDesc = this.getBody(node, writer);

        const res: SrcDesc = [...headerDesc, " ", ...bodyDesc];

        descTrimRight(res);

        return res;
    }

    private getHeader(node: ContractDefinition, writer: ASTWriter): DescArgs {
        const result: DescArgs = [];

        if (gte(writer.targetCompilerVersion, "0.6.0") && node.abstract) {
            result.push("abstract ");
        }

        result.push(node.kind, " ", node.name);

        if (node.vInheritanceSpecifiers.length) {
            result.push(" is ", ...join(node.vInheritanceSpecifiers, ", "));
        }

        return result;
    }

    private getBody(node: ContractDefinition, writer: ASTWriter): SrcDesc {
        const formatter = writer.formatter;

        const wrap = formatter.renderWrap();

        const writeFn = (n: ASTNode): DescArgs => [formatter.renderIndent(), n];
        const writeLineFn = (n: ASTNode): DescArgs => [formatter.renderIndent(), n, wrap];

        const result: DescArgs = [];

        const oldIndent = formatter.renderIndent();

        formatter.increaseNesting();

        if (node.vUsingForDirectives.length) {
            result.push(...flatten(node.vUsingForDirectives.map(writeLineFn)), wrap);
        }

        if (node.vEnums.length) {
            result.push(...flatJoin(node.vEnums.map(writeLineFn), wrap), wrap);
        }

        if (node.vEvents.length) {
            result.push(...flatJoin(node.vEvents.map(writeLineFn), wrap), wrap);
        }

        if (node.vStructs.length) {
            result.push(...flatJoin(node.vStructs.map(writeLineFn), wrap), wrap);
        }

        if (node.vStateVariables.length) {
            result.push(
                ...flatten(node.vStateVariables.map((n) => [...writeFn(n), ";", wrap])),
                wrap
            );
        }

        if (node.vModifiers.length) {
            result.push(...flatJoin(node.vModifiers.map(writeLineFn), wrap), wrap);
        }

        if (node.vFunctions.length) {
            result.push(...flatJoin(node.vFunctions.map(writeLineFn), wrap));
        }

        if (result.length) {
            const bodyDesc = writer.desc(...result);

            descTrimRight(bodyDesc);

            formatter.decreaseNesting();

            return ["{", wrap, ...bodyDesc, wrap, oldIndent, "}"];
        }

        formatter.decreaseNesting();

        return ["{}"];
    }
}

class ImportDirectiveWriter extends ASTNodeWriter {
    writeInner(node: ImportDirective, writer: ASTWriter): SrcDesc {
        if (node.unitAlias) {
            return [`import "${node.file}" as ${node.unitAlias};`];
        }

        if (node.vSymbolAliases.length) {
            const entries: SrcDesc[] = [];

            for (let i = 0; i < node.vSymbolAliases.length; i++) {
                const rawSymAlias = node.symbolAliases[i];
                const [origin, alias] = node.vSymbolAliases[i];

                if (rawSymAlias.foreign instanceof Identifier) {
                    const desc = writer.desc(rawSymAlias.foreign);
                    if (alias) {
                        desc.push(` as ${alias}`);
                    }
                    entries.push(desc);
                } else {
                    const symbol =
                        origin instanceof ImportDirective ? origin.unitAlias : origin.name;
                    entries.push([alias !== undefined ? symbol + " as " + alias : symbol]);
                }
            }

            return [`import { `, ...flatJoin(entries, ", "), ` } from "${node.file}";`];
        }

        return [`import "${node.file}";`];
    }
}

class PragmaDirectiveWriter extends ASTNodeWriter {
    writeInner(node: PragmaDirective): SrcDesc {
        return [`pragma ${node.vIdentifier} ${node.vValue};`];
    }
}

class SourceUnitWriter extends ASTNodeWriter {
    writeInner(node: SourceUnit, writer: ASTWriter): SrcDesc {
        const wrap = writer.formatter.renderWrap();

        const writeFn = (n: ASTNode): SrcDesc => writer.desc(n);
        const writeLineFn = (n: ASTNode): SrcDesc => writer.desc(n, wrap);

        const result: SrcDesc = [];

        if (node.vPragmaDirectives.length > 0) {
            result.push(...flatten(node.vPragmaDirectives.map(writeLineFn)), wrap);
        }

        if (node.vImportDirectives.length > 0) {
            result.push(...flatten(node.vImportDirectives.map(writeLineFn)), wrap);
        }

        const typeDefs = node.vEnums.concat(node.vStructs);

        if (typeDefs.length > 0) {
            result.push(...flatJoin(typeDefs.map(writeLineFn), wrap), wrap);
        }

        if (node.vVariables.length > 0) {
            result.push(...flatten(node.vVariables.map((n) => [...writeFn(n), ";", wrap])), wrap);
        }

        const otherDefs = (node.vFunctions as readonly ASTNode[]).concat(node.vContracts);

        if (otherDefs.length > 0) {
            result.push(...flatJoin(otherDefs.map(writeLineFn), wrap));
        }

        descTrimRight(result);

        return result;
    }
}

export const DefaultASTWriterMapping = new Map<ASTNodeConstructor<ASTNode>, ASTNodeWriter>([
    [ElementaryTypeName, new ElementaryTypeNameWriter()],
    [ArrayTypeName, new ArrayTypeNameWriter()],
    [Mapping, new MappingTypeNameWriter()],
    [UserDefinedTypeName, new UserDefinedTypeNameWriter()],
    [FunctionTypeName, new FunctionTypeNameWriter()],
    [Literal, new LiteralWriter()],
    [Identifier, new IdentifierWriter()],
    [IdentifierPath, new IdentifierPathWriter()],
    [FunctionCallOptions, new FunctionCallOptionsWriter()],
    [FunctionCall, new FunctionCallWriter()],
    [MemberAccess, new MemberAccessWriter()],
    [IndexAccess, new IndexAccessWriter()],
    [IndexRangeAccess, new IndexRangeAccessWriter()],
    [UnaryOperation, new UnaryOperationWriter()],
    [BinaryOperation, new BinaryOperationWriter()],
    [Conditional, new ConditionalWriter()],
    [ElementaryTypeNameExpression, new ElementaryTypeNameExpressionWriter()],
    [NewExpression, new NewExpressionWriter()],
    [TupleExpression, new TupleExpressionWriter()],
    [ExpressionStatement, new ExpressionStatementWriter()],
    [Assignment, new AssignmentWriter()],
    [VariableDeclaration, new VariableDeclarationWriter()],
    [Block, new BlockWriter()],
    [UncheckedBlock, new UncheckedBlockWriter()],
    [VariableDeclarationStatement, new VariableDeclarationStatementWriter()],
    [IfStatement, new IfStatementWriter()],
    [ForStatement, new ForStatementWriter()],
    [WhileStatement, new WhileStatementWriter()],
    [DoWhileStatement, new DoWhileStatementWriter()],
    [Return, new ReturnWriter()],
    [EmitStatement, new EmitStatementWriter()],
    [PlaceholderStatement, new PlaceholderStatementWriter()],
    [InlineAssembly, new InlineAssemblyWriter()],
    [TryCatchClause, new TryCatchClauseWriter()],
    [TryStatement, new TryStatementWriter()],
    [Break, new BreakWriter()],
    [Continue, new ContinueWriter()],
    [Throw, new ThrowWriter()],
    [ParameterList, new ParameterListWriter()],
    [ModifierInvocation, new ModifierInvocationWriter()],
    [OverrideSpecifier, new OverrideSpecifierWriter()],
    [FunctionDefinition, new FunctionDefinitionWriter()],
    [ModifierDefinition, new ModifierDefinitionWriter()],
    [EventDefinition, new EventDefinitionWriter()],
    [StructDefinition, new StructDefinitionWriter()],
    [EnumValue, new EnumValueWriter()],
    [EnumDefinition, new EnumDefinitionWriter()],
    [UsingForDirective, new UsingForDirectiveWriter()],
    [InheritanceSpecifier, new InheritanceSpecifierWriter()],
    [ContractDefinition, new ContractDefinitionWriter()],
    [StructuredDocumentation, new StructuredDocumentationWriter()],
    [ImportDirective, new ImportDirectiveWriter()],
    [PragmaDirective, new PragmaDirectiveWriter()],
    [SourceUnit, new SourceUnitWriter()]
]);
