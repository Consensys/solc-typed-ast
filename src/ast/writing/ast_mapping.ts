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

function trimRight(desc: SrcDesc): void {
    while (desc.length > 0) {
        const last = desc[desc.length - 1];

        if (typeof last === "string") {
            if (last.match(/^\s*$/)) {
                desc.pop();
                continue;
            }
        } else {
            trimRight(last[1]);
        }

        break;
    }
}

function join<T1, T2>(arr: readonly T1[], join: T2): Array<T1 | T2> {
    const res: Array<T1 | T2> = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]);
        if (i != arr.length - 1) {
            res.push(join);
        }
    }

    return res;
}

function flatJoin<T1, T2>(arr: T1[][], join: T2): Array<T1 | T2> {
    const res: Array<T1 | T2> = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(...arr[i]);
        if (i != arr.length - 1) {
            res.push(join);
        }
    }

    return res;
}

function flatten<T>(arr: T[][]): T[] {
    const res: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(...arr[i]);
    }

    return res;
}

class ElementaryTypeNameWriter implements ASTNodeWriter {
    write(node: ElementaryTypeName, writer: ASTWriter): SrcDesc {
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

class ArrayTypeNameWriter implements ASTNodeWriter {
    write(node: ArrayTypeName, writer: ASTWriter): SrcDesc {
        if (node.vLength) {
            return writer.desc(node.vBaseType, "[", node.vLength, "]");
        }

        return writer.desc(node.vBaseType, "[]");
    }
}

class MappingTypeNameWriter implements ASTNodeWriter {
    write(node: Mapping, writer: ASTWriter): SrcDesc {
        return writer.desc("mapping(", node.vKeyType, " => ", node.vValueType, ")");
    }
}

class UserDefinedTypeNameWriter implements ASTNodeWriter {
    write(node: UserDefinedTypeName, writer: ASTWriter): SrcDesc {
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

class IdentifierPathWriter implements ASTNodeWriter {
    write(node: IdentifierPath): SrcDesc {
        return [node.name];
    }
}

class FunctionTypeNameWriter implements ASTNodeWriter {
    write(node: FunctionTypeName, writer: ASTWriter): SrcDesc {
        const elements = ["function ", node.vParameterTypes, ` ${node.visibility}`];

        if (node.stateMutability !== FunctionStateMutability.NonPayable) {
            elements.push(" " + node.stateMutability);
        }

        if (node.vReturnParameterTypes.vParameters.length) {
            elements.push(` returns `, node.vReturnParameterTypes);
        }

        return writer.desc(...elements);
    }
}

class LiteralWriter implements ASTNodeWriter {
    write(node: Literal): SrcDesc {
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

class IdentifierWriter implements ASTNodeWriter {
    write(node: Identifier): SrcDesc {
        return [node.name];
    }
}

class FunctionCallOptionsWriter implements ASTNodeWriter {
    write(node: FunctionCallOptions, writer: ASTWriter): SrcDesc {
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

class FunctionCallWriter implements ASTNodeWriter {
    write(node: FunctionCall, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [node.vExpression, "(", ...join(node.vArguments, ", "), ")"];

        return writer.desc(...elements);
    }
}

class MemberAccessWriter implements ASTNodeWriter {
    write(node: MemberAccess, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vExpression, `.${node.memberName}`);
    }
}

class IndexAccessWriter implements ASTNodeWriter {
    write(node: IndexAccess, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vBaseExpression, "[", node.vIndexExpression, "]");
    }
}

class IndexRangeAccessWriter implements ASTNodeWriter {
    write(node: IndexRangeAccess, writer: ASTWriter): SrcDesc {
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

/**
 * Determine if a given unary/binary/conditional expression needs to be surrounded
 * by parenthesis to clarify order of evaluation.
 *
 * @param e - expression
 */
function needsParenthesis(e: UnaryOperation | BinaryOperation | Conditional): boolean {
    return (
        e.parent instanceof UnaryOperation ||
        e.parent instanceof BinaryOperation ||
        e.parent instanceof Conditional
    );
}

class UnaryOperationWriter implements ASTNodeWriter {
    write(node: UnaryOperation, writer: ASTWriter): SrcDesc {
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

class BinaryOperationWriter implements ASTNodeWriter {
    write(node: BinaryOperation, writer: ASTWriter): SrcDesc {
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

class ConditionalWriter implements ASTNodeWriter {
    write(node: Conditional, writer: ASTWriter): SrcDesc {
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

class AssignmentWriter implements ASTNodeWriter {
    write(node: Assignment, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vLeftHandSide, ` ${node.operator} `, node.vRightHandSide);
    }
}

class ElementaryTypeNameExpressionWriter implements ASTNodeWriter {
    write(node: ElementaryTypeNameExpression, writer: ASTWriter): SrcDesc {
        return writer.desc(node.typeName);
    }
}

class NewExpressionWriter implements ASTNodeWriter {
    write(node: NewExpression, writer: ASTWriter): SrcDesc {
        return writer.desc("new ", node.vTypeName);
    }
}

class TupleExpressionWriter implements ASTNodeWriter {
    write(node: TupleExpression, writer: ASTWriter): SrcDesc {
        if (node.isInlineArray) {
            return writer.desc("[", ...join(node.vOriginalComponents, ", "), "]");
        }

        return writer.desc("(", ...join(node.vOriginalComponents, ", "), ")");
    }
}

class ExpressionStatementWriter implements ASTNodeWriter {
    write(node: ExpressionStatement, writer: ASTWriter): SrcDesc {
        const elements: DescArgs = [node.vExpression];

        if (
            !(
                node.parent instanceof ForStatement &&
                (node.parent.vLoopExpression === node ||
                    (node.parent.vInitializationExpression as unknown) === node)
            )
        ) {
            elements.push(";");
        }

        return writer.desc(...elements);
    }
}

class VariableDeclarationStatementWriter implements ASTNodeWriter {
    write(node: VariableDeclarationStatement, writer: ASTWriter): SrcDesc {
        const elements = this.getDeclarations(node);

        if (node.vInitialValue) {
            elements.push(" = ", node.vInitialValue);
        }

        if (
            !(node.parent instanceof ForStatement && node.parent.vInitializationExpression === node)
        ) {
            elements.push(";");
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
        if (isUntyped) tuple.unshift("var ");

        return tuple;
    }
}

class IfStatementWriter implements ASTNodeWriter {
    write(node: IfStatement, writer: ASTWriter): SrcDesc {
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

class ForStatementWriter implements ASTNodeWriter {
    write(node: ForStatement, writer: ASTWriter): SrcDesc {
        return writer.desc(
            "for (",
            node.vInitializationExpression,
            "; ",
            node.vCondition,
            "; ",
            node.vLoopExpression,
            ") ",
            node.vBody
        );
    }
}

class WhileStatementWriter implements ASTNodeWriter {
    write(node: WhileStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("while (", node.vCondition, ") ", node.vBody);
    }
}

class DoWhileStatementWriter implements ASTNodeWriter {
    write(node: DoWhileStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("do ", node.vBody, " while(", node.vCondition, ");");
    }
}

class ReturnWriter implements ASTNodeWriter {
    write(node: Return, writer: ASTWriter): SrcDesc {
        return writer.desc("return ", node.vExpression, ";");
    }
}

class BreakWriter implements ASTNodeWriter {
    write(): SrcDesc {
        return ["break;"];
    }
}

class ContinueWriter implements ASTNodeWriter {
    write(): SrcDesc {
        return ["continue;"];
    }
}

class ThrowWriter implements ASTNodeWriter {
    write(): SrcDesc {
        return ["throw;"];
    }
}

class EmitStatementWriter implements ASTNodeWriter {
    write(node: EmitStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("emit ", node.vEventCall, ";");
    }
}

class PlaceholderStatementWriter implements ASTNodeWriter {
    write(): SrcDesc {
        return ["_;"];
    }
}

class InlineAssemblyWriter implements ASTNodeWriter {
    write(node: InlineAssembly, writer: ASTWriter): SrcDesc {
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

class TryCatchClauseWriter implements ASTNodeWriter {
    write(node: TryCatchClause, writer: ASTWriter): SrcDesc {
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

class TryStatementWriter implements ASTNodeWriter {
    write(node: TryStatement, writer: ASTWriter): SrcDesc {
        return writer.desc("try ", node.vExternalCall, " ", ...node.vClauses);
    }
}

class StructuredDocumentationWriter implements ASTNodeWriter {
    static render(text: string, formatter: SourceFormatter): string {
        const indent = formatter.renderIndent();
        const prefix = "/// ";

        const documentation = text.replace(/\n/g, (sub) => sub + indent + prefix);

        return prefix + documentation + "\n" + indent;
    }

    write(node: StructuredDocumentation, writer: ASTWriter): SrcDesc {
        return [StructuredDocumentationWriter.render(node.text, writer.formatter)];
    }
}

class VariableDeclarationWriter implements ASTNodeWriter {
    write(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
        const desc = this.getVariable(node, writer);

        if (node.documentation) {
            if (node.documentation instanceof StructuredDocumentation) {
                desc.unshift(...writer.desc(node.documentation));
            } else {
                desc.unshift(
                    StructuredDocumentationWriter.render(node.documentation, writer.formatter)
                );
            }
        }

        return desc;
    }

    private getVariable(node: VariableDeclaration, writer: ASTWriter): SrcDesc {
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

class ParameterListWriter implements ASTNodeWriter {
    write(node: ParameterList, writer: ASTWriter): SrcDesc {
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

class BlockWriter implements ASTNodeWriter {
    write(node: Block, writer: ASTWriter): SrcDesc {
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

class UncheckedBlockWriter implements ASTNodeWriter {
    write(node: UncheckedBlock, writer: ASTWriter): SrcDesc {
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

class EventDefinitionWriter implements ASTNodeWriter {
    write(node: EventDefinition, writer: ASTWriter): SrcDesc {
        const res = writer.desc(
            "event ",
            node.name,
            node.vParameters,
            node.anonymous ? " anonymous" : "",
            ";"
        );

        if (node.documentation) {
            if (node.documentation instanceof StructuredDocumentation) {
                res.unshift([node.documentation, writer.desc(node.documentation)]);
            } else {
                res.unshift(
                    StructuredDocumentationWriter.render(node.documentation, writer.formatter)
                );
            }
        }

        return res;
    }
}

class StructDefinitionWriter implements ASTNodeWriter {
    write(node: StructDefinition, writer: ASTWriter): SrcDesc {
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

class ModifierDefinitionWriter implements ASTNodeWriter {
    write(node: ModifierDefinition, writer: ASTWriter): SrcDesc {
        const args: DescArgs = [node.documentation, "modifier ", node.name, " ", node.vParameters];

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

class ModifierInvocationWriter implements ASTNodeWriter {
    write(node: ModifierInvocation, writer: ASTWriter): SrcDesc {
        return writer.desc(node.vModifierName, "(", ...join(node.vArguments, ","), ")");
    }
}

class OverrideSpecifierWriter implements ASTNodeWriter {
    write(node: OverrideSpecifier, writer: ASTWriter): SrcDesc {
        if (node.vOverrides.length) {
            return writer.desc("override", "(", ...join(node.vOverrides, ", "), ")");
        }

        return ["override"];
    }
}

class FunctionDefinitionWriter implements ASTNodeWriter {
    write(node: FunctionDefinition, writer: ASTWriter): SrcDesc {
        const args = this.getHeader(node, writer);

        if (!node.vBody) {
            return writer.desc(...args, ";");
        }

        const res = writer.desc(...args);
        res.push(" ", ...writer.desc(node.vBody));

        return res;
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

class UsingForDirectiveWriter implements ASTNodeWriter {
    write(node: UsingForDirective, writer: ASTWriter): SrcDesc {
        return writer.desc(
            "using ",
            node.vLibraryName,
            " for ",
            node.vTypeName ? node.vTypeName : "*",
            ";"
        );
    }
}

class EnumValueWriter implements ASTNodeWriter {
    write(node: EnumValue): SrcDesc {
        return [node.name];
    }
}

class EnumDefinitionWriter implements ASTNodeWriter {
    write(node: EnumDefinition, writer: ASTWriter): SrcDesc {
        return writer.desc("enum ", node.name, " ", "{ ", ...join(node.vMembers, ", "), " }");
    }
}

class InheritanceSpecifierWriter implements ASTNodeWriter {
    write(node: InheritanceSpecifier, writer: ASTWriter): SrcDesc {
        const args: DescArgs = [node.vBaseType];

        if (node.vArguments.length) {
            args.push("(", ...join(node.vArguments, ", "), ")");
        }

        return writer.desc(...args);
    }
}

class ContractDefinitionWriter implements ASTNodeWriter {
    write(node: ContractDefinition, writer: ASTWriter): SrcDesc {
        const headerArgs = this.getHeader(node, writer);
        const headerDesc = writer.desc(...headerArgs);

        const bodyDesc = this.getBody(node, writer);

        const res: SrcDesc = [...headerDesc, " ", ...bodyDesc];
        trimRight(res);
        return res;
    }

    private getHeader(node: ContractDefinition, writer: ASTWriter): DescArgs {
        const result: DescArgs = [];

        if (gte(writer.targetCompilerVersion, "0.6.0") && node.abstract) {
            result.push("abstract ");
        }

        result.push(node.kind, " ", node.name);

        if (node.vInheritanceSpecifiers.length) {
            result.push(` is `, ...join(node.vInheritanceSpecifiers, ", "));
        }

        if (node.documentation) {
            if (node.documentation instanceof StructuredDocumentation) {
                result.unshift(node.documentation);
            } else {
                result.unshift(
                    StructuredDocumentationWriter.render(node.documentation, writer.formatter)
                );
            }
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
            result.push(...flatJoin(node.vModifiers.map(writeLineFn), wrap));
        }

        if (node.vFunctions.length) {
            result.push(...flatJoin(node.vFunctions.map(writeLineFn), wrap));
        }

        if (result.length) {
            const bodyDesc = writer.desc(...result);
            trimRight(bodyDesc);
            formatter.decreaseNesting();
            return ["{", wrap, ...bodyDesc, wrap, oldIndent, "}"];
        }

        formatter.decreaseNesting();
        return ["{}"];
    }
}

class ImportDirectiveWriter implements ASTNodeWriter {
    write(node: ImportDirective): SrcDesc {
        if (node.unitAlias) {
            return [`import "${node.file}" as ${node.unitAlias};`];
        }

        if (node.vSymbolAliases.length) {
            const entries: string[] = [];

            for (const [origin, alias] of node.vSymbolAliases) {
                const symbol = origin instanceof ImportDirective ? origin.unitAlias : origin.name;

                entries.push(alias !== undefined ? symbol + " as " + alias : symbol);
            }

            return [`import { ${entries.join(", ")} } from "${node.file}";`];
        }

        return [`import "${node.file}";`];
    }
}

class PragmaDirectiveWriter implements ASTNodeWriter {
    write(node: PragmaDirective): SrcDesc {
        return [`pragma ${node.vIdentifier} ${node.vValue};`];
    }
}

class SourceUnitWriter implements ASTNodeWriter {
    write(node: SourceUnit, writer: ASTWriter): SrcDesc {
        const wrap = writer.formatter.renderWrap();

        const writeFn = (n: ASTNode): SrcDesc => writer.desc(n);
        const writeLineFn = (n: ASTNode): SrcDesc => writer.desc(n, wrap);

        const result: SrcDesc = [];

        if (node.vPragmaDirectives.length > 0) {
            result.push(...flatten(node.vPragmaDirectives.map(writeLineFn)), wrap);
        }

        if (node.vImportDirectives.length > 0) {
            result.push(...flatten(node.vImportDirectives.map(writeLineFn)));
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

        trimRight(result);
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
