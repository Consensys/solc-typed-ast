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
import { ASTNodeWriter, ASTWriter, YulWriter } from "./writer";
import { DefaultYulWriterMapping } from "./yul_mapping";

class ElementaryTypeNameWriter implements ASTNodeWriter {
    write(node: ElementaryTypeName, writer: ASTWriter): string {
        if (satisfies(writer.targetCompilerVersion, "0.4")) {
            return node.name;
        }

        if (
            gte(writer.targetCompilerVersion, "0.6.0") &&
            node.name === "address" &&
            node.parent instanceof ElementaryTypeNameExpression
        ) {
            return node.stateMutability === "payable" ? "payable" : "address";
        }

        return node.stateMutability === "payable" ? node.name + " payable" : node.name;
    }
}

class ArrayTypeNameWriter implements ASTNodeWriter {
    write(node: ArrayTypeName, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const baseType = writer.write(node.vBaseType, fragments);

        if (node.vLength) {
            const length = writer.write(node.vLength, fragments);

            return baseType + "[" + length + "]";
        }

        return baseType + "[]";
    }
}

class MappingTypeNameWriter implements ASTNodeWriter {
    write(node: Mapping, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const k = writer.write(node.vKeyType, fragments);
        const v = writer.write(node.vValueType, fragments);

        return "mapping(" + k + " => " + v + ")";
    }
}

class UserDefinedTypeNameWriter implements ASTNodeWriter {
    write(node: UserDefinedTypeName, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        if (node.path) {
            return writer.write(node.path, fragments);
        }

        if (node.name === undefined) {
            throw new Error(
                "Unable to detect name of user-defined type reference node: " + node.print()
            );
        }

        return node.name;
    }
}

class IdentifierPathWriter implements ASTNodeWriter {
    write(node: IdentifierPath): string {
        return node.name;
    }
}

class FunctionTypeNameWriter implements ASTNodeWriter {
    write(node: FunctionTypeName, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const args = writer.write(node.vParameterTypes, fragments);
        const result = ["function" + args, node.visibility];

        if (node.stateMutability !== FunctionStateMutability.NonPayable) {
            result.push(node.stateMutability);
        }

        if (node.vReturnParameterTypes.vParameters.length) {
            const rets = writer.write(node.vReturnParameterTypes, fragments);

            result.push("returns", rets);
        }

        return result.join(" ");
    }
}

class LiteralWriter implements ASTNodeWriter {
    write(node: Literal): string {
        if (node.kind === LiteralKind.String) {
            return node.value === null ? 'hex"' + node.hexValue + '"' : JSON.stringify(node.value);
        }

        if (node.kind === LiteralKind.HexString) {
            return 'hex"' + node.hexValue + '"';
        }

        if (node.kind === LiteralKind.UnicodeString) {
            return 'unicode"' + node.value + '"';
        }

        let result = node.value;

        if (node.subdenomination !== undefined) {
            result += " " + node.subdenomination;
        }

        return result;
    }
}

class IdentifierWriter implements ASTNodeWriter {
    write(node: Identifier): string {
        return node.name;
    }
}

class FunctionCallOptionsWriter implements ASTNodeWriter {
    write(node: FunctionCallOptions, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const expr = writer.write(node.vExpression, fragments);
        const options: string[] = [];

        for (const [name, value] of node.vOptionsMap.entries()) {
            options.push(name + ": " + writer.write(value, fragments));
        }

        return expr + "{" + options.join(", ") + "}";
    }
}

class FunctionCallWriter implements ASTNodeWriter {
    write(node: FunctionCall, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const expr = writer.write(node.vExpression, fragments);

        if (node.vArguments.length) {
            const args = node.vArguments.map((arg) => writer.write(arg, fragments));

            return expr + "(" + args.join(", ") + ")";
        }

        return expr + "()";
    }
}

class MemberAccessWriter implements ASTNodeWriter {
    write(node: MemberAccess, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const expr = writer.write(node.vExpression, fragments);

        return expr + "." + node.memberName;
    }
}

class IndexAccessWriter implements ASTNodeWriter {
    write(node: IndexAccess, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const base = writer.write(node.vBaseExpression, fragments);

        if (node.vIndexExpression) {
            const index = writer.write(node.vIndexExpression, fragments);

            return base + "[" + index + "]";
        }

        return base + "[]";
    }
}

class IndexRangeAccessWriter implements ASTNodeWriter {
    write(node: IndexRangeAccess, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const base = writer.write(node.vBaseExpression, fragments);
        const start = node.vStartExpression ? writer.write(node.vStartExpression, fragments) : "";
        const end = node.vEndExpression ? writer.write(node.vEndExpression, fragments) : "";

        return base + "[" + start + ":" + end + "]";
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
    write(node: UnaryOperation, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const sub = writer.write(node.vSubExpression, fragments);
        const operator = node.operator;

        if (operator === "delete") {
            return operator + " " + sub;
        }

        const res = node.prefix ? operator + sub : sub + operator;
        return needsParenthesis(node) ? "(" + res + ")" : res;
    }
}

class BinaryOperationWriter implements ASTNodeWriter {
    write(node: BinaryOperation, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const l = writer.write(node.vLeftExpression, fragments);
        const r = writer.write(node.vRightExpression, fragments);

        const res = l + " " + node.operator + " " + r;
        return needsParenthesis(node) ? "(" + res + ")" : res;
    }
}

class ConditionalWriter implements ASTNodeWriter {
    write(node: Conditional, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const c = writer.write(node.vCondition, fragments);
        const t = writer.write(node.vTrueExpression, fragments);
        const f = writer.write(node.vFalseExpression, fragments);

        const res = c + " ? " + t + " : " + f;
        return needsParenthesis(node) ? "(" + res + ")" : res;
    }
}

class AssignmentWriter implements ASTNodeWriter {
    write(node: Assignment, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const l = writer.write(node.vLeftHandSide, fragments);
        const r = writer.write(node.vRightHandSide, fragments);

        return l + " " + node.operator + " " + r;
    }
}

class ElementaryTypeNameExpressionWriter implements ASTNodeWriter {
    write(
        node: ElementaryTypeNameExpression,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        return typeof node.typeName === "string"
            ? node.typeName
            : writer.write(node.typeName, fragments);
    }
}

class NewExpressionWriter implements ASTNodeWriter {
    write(node: NewExpression, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const expr = writer.write(node.vTypeName, fragments);

        return "new " + expr;
    }
}

class TupleExpressionWriter implements ASTNodeWriter {
    write(node: TupleExpression, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const components = node.vOriginalComponents.map((c) =>
            c ? writer.write(c, fragments) : ""
        );

        if (node.isInlineArray) {
            return "[" + components.join(", ") + "]";
        }

        return "(" + components.join(", ") + ")";
    }
}

class ExpressionStatementWriter implements ASTNodeWriter {
    write(node: ExpressionStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const noSemi = node.parent instanceof ForStatement && node.parent.vLoopExpression === node;
        return writer.write(node.vExpression, fragments) + (noSemi ? "" : ";");
    }
}

class VariableDeclarationStatementWriter implements ASTNodeWriter {
    write(
        node: VariableDeclarationStatement,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const declarations = this.getDeclarations(node, writer, fragments);

        const noSemi =
            node.parent instanceof ForStatement && node.parent.vInitializationExpression === node;

        if (node.vInitialValue) {
            const value = writer.write(node.vInitialValue, fragments);

            return declarations + " = " + value + (noSemi ? "" : ";");
        }

        return declarations + (noSemi ? "" : ";");
    }

    private getDeclarations(
        node: VariableDeclarationStatement,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const assignments = node.assignments;
        const children = node.children;

        if (assignments.length < 2 || assignments.every((id) => id === null)) {
            const declaration = node.vDeclarations[0];

            return declaration.vType === undefined
                ? "var " + writer.write(declaration, fragments)
                : writer.write(declaration, fragments);
        }

        const isUntyped = node.vDeclarations.every(
            (declaration) => declaration.vType === undefined
        );

        const declarations = assignments.map((id) => {
            if (id === null) {
                return "";
            }

            const declaration = children.find((c) => c.id === id);

            if (!declaration) {
                throw new Error(
                    `Unable to find assigned declaration ${id} in children of ${node.print()}`
                );
            }

            return writer.write(declaration, fragments);
        });

        const tuple = "(" + declarations.join(", ") + ")";

        return isUntyped ? "var " + tuple : tuple;
    }
}

class IfStatementWriter implements ASTNodeWriter {
    write(node: IfStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const condition = writer.write(node.vCondition, fragments);
        const trueBody = writer.write(node.vTrueBody, fragments);

        if (node.vFalseBody) {
            const falseBody = writer.write(node.vFalseBody, fragments);

            return `if (${condition}) ${trueBody} else ${falseBody}`;
        }

        return `if (${condition}) ${trueBody}`;
    }
}

class ForStatementWriter implements ASTNodeWriter {
    write(node: ForStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const body = writer.write(node.vBody, fragments);

        /**
         * Special case: for initialization expression and loop post-expression
         * statements trailing semicolons are removed, as `for` statement
         * uses semicolons as section delimiters.
         */
        const header = [
            node.vInitializationExpression
                ? writer.write(node.vInitializationExpression, fragments)
                : "",
            node.vCondition ? writer.write(node.vCondition, fragments) : "",
            node.vLoopExpression ? writer.write(node.vLoopExpression, fragments) : ""
        ];

        return "for (" + header.join("; ") + ") " + body;
    }
}

class WhileStatementWriter implements ASTNodeWriter {
    write(node: WhileStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const condition = writer.write(node.vCondition, fragments);
        const body = writer.write(node.vBody, fragments);

        return "while (" + condition + ") " + body;
    }
}

class DoWhileStatementWriter implements ASTNodeWriter {
    write(node: DoWhileStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const condition = writer.write(node.vCondition, fragments);
        const body = writer.write(node.vBody, fragments);

        return "do " + body + " while(" + condition + ");";
    }
}

class ReturnWriter implements ASTNodeWriter {
    write(node: Return, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        return node.vExpression
            ? "return " + writer.write(node.vExpression, fragments) + ";"
            : "return;";
    }
}

class BreakWriter implements ASTNodeWriter {
    write(): string {
        return "break;";
    }
}

class ContinueWriter implements ASTNodeWriter {
    write(): string {
        return "continue;";
    }
}

class ThrowWriter implements ASTNodeWriter {
    write(): string {
        return "throw;";
    }
}

class EmitStatementWriter implements ASTNodeWriter {
    write(node: EmitStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        return "emit " + writer.write(node.vEventCall, fragments) + ";";
    }
}

class PlaceholderStatementWriter implements ASTNodeWriter {
    write(): string {
        return "_;";
    }
}

class InlineAssemblyWriter implements ASTNodeWriter {
    write(node: InlineAssembly, writer: ASTWriter): string {
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

        return "assembly " + yul;
    }
}

class TryCatchClauseWriter implements ASTNodeWriter {
    write(node: TryCatchClause, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const body = writer.write(node.vBlock, fragments);
        const args = node.vParameters ? writer.write(node.vParameters, fragments) : "";

        if (node.previousSibling instanceof FunctionCall) {
            if (args === "") {
                return body;
            }

            return "returns " + args + " " + body;
        }

        return "catch " + node.errorName + args + " " + body;
    }
}

class TryStatementWriter implements ASTNodeWriter {
    write(node: TryStatement, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const call = writer.write(node.vExternalCall, fragments);
        const clauses = node.vClauses.map((clause) => writer.write(clause, fragments));

        return "try " + call + " " + clauses.join(" ");
    }
}

class StructuredDocumentationWriter implements ASTNodeWriter {
    static render(text: string, formatter: SourceFormatter): string {
        const indent = formatter.renderIndent();
        const prefix = "/// ";

        const documentation = text.replace(/\n/g, (sub) => sub + indent + prefix);

        return prefix + documentation + "\n" + indent;
    }

    write(node: StructuredDocumentation, writer: ASTWriter): string {
        return StructuredDocumentationWriter.render(node.text, writer.formatter);
    }
}

class VariableDeclarationWriter implements ASTNodeWriter {
    write(node: VariableDeclaration, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const declaration = this.getVariable(node, writer, fragments);

        if (node.documentation) {
            const docs =
                node.documentation instanceof StructuredDocumentation
                    ? writer.write(node.documentation, fragments)
                    : StructuredDocumentationWriter.render(node.documentation, writer.formatter);

            return docs + declaration;
        }

        return declaration;
    }

    private getVariable(
        node: VariableDeclaration,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        if (node.vScope instanceof SourceUnit) {
            return this.getUnitConstant(node, writer, fragments);
        }

        return node.stateVariable
            ? this.getStateVariable(node, writer, fragments)
            : this.getLocalVariable(node, writer, fragments);
    }

    private getUnitConstant(
        node: VariableDeclaration,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        if (!(node.vType && node.vValue && node.mutability === Mutability.Constant)) {
            throw new Error("Malformed unit-level constant variable: " + node.print());
        }

        const type = writer.write(node.vType, fragments);
        const value = writer.write(node.vValue, fragments);

        return type + " " + node.mutability + " " + node.name + " = " + value;
    }

    private getStateVariable(
        node: VariableDeclaration,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        if (!node.vType) {
            throw new Error("Unexpected untyped state variable: " + node.print());
        }

        const result = [writer.write(node.vType, fragments)];

        if (node.visibility !== StateVariableVisibility.Default) {
            result.push(node.visibility);
        }

        if (node.mutability !== Mutability.Mutable) {
            result.push(node.mutability);
        }

        if (node.vOverrideSpecifier) {
            result.push(writer.write(node.vOverrideSpecifier, fragments));
        }

        result.push(node.name);

        if (node.vValue) {
            result.push("=", writer.write(node.vValue, fragments));
        }

        return result.join(" ");
    }

    private getLocalVariable(
        node: VariableDeclaration,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const result = [];

        if (node.vType) {
            result.push(writer.write(node.vType, fragments));
        }

        if (node.storageLocation !== DataLocation.Default) {
            result.push(node.storageLocation);
        }

        if (node.indexed) {
            result.push("indexed");
        }

        if (node.name !== "") {
            result.push(node.name);
        }

        return result.join(" ");
    }
}

class ParameterListWriter implements ASTNodeWriter {
    write(node: ParameterList, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const vars = node.vParameters.map((v) => writer.write(v, fragments));

        return "(" + vars.join(", ") + ")";
    }
}

class BlockWriter implements ASTNodeWriter {
    write(node: Block, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        if (node.children.length === 0) {
            return "{}";
        }

        const formatter = writer.formatter;

        formatter.increaseNesting();

        const statements = node.children.map(
            (s) => formatter.renderIndent() + writer.write(s, fragments)
        );

        formatter.decreaseNesting();

        const wrap = formatter.renderWrap();
        const indent = formatter.renderIndent();

        return "{" + wrap + statements.join(wrap) + wrap + indent + "}";
    }
}

class UncheckedBlockWriter implements ASTNodeWriter {
    write(node: UncheckedBlock, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        if (node.children.length === 0) {
            return "unchecked {}";
        }

        const formatter = writer.formatter;

        formatter.increaseNesting();

        const statements = node.children.map(
            (s) => formatter.renderIndent() + writer.write(s, fragments)
        );

        formatter.decreaseNesting();

        const wrap = formatter.renderWrap();
        const indent = formatter.renderIndent();

        return "unchecked {" + wrap + statements.join(wrap) + wrap + indent + "}";
    }
}

class EventDefinitionWriter implements ASTNodeWriter {
    write(node: EventDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const args = writer.write(node.vParameters, fragments);
        const definition = "event " + node.name + args + (node.anonymous ? " anonymous" : "") + ";";

        if (node.documentation) {
            const docs =
                node.documentation instanceof StructuredDocumentation
                    ? writer.write(node.documentation, fragments)
                    : StructuredDocumentationWriter.render(node.documentation, writer.formatter);

            return docs + definition;
        }

        return definition;
    }
}

class StructDefinitionWriter implements ASTNodeWriter {
    write(node: StructDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        return "struct " + node.name + " " + this.getBody(node, writer, fragments);
    }

    private getBody(
        node: StructDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        if (node.vMembers.length === 0) {
            return "{}";
        }

        const formatter = writer.formatter;
        const wrap = formatter.renderWrap();
        const currentIndent = formatter.renderIndent();

        formatter.increaseNesting();

        const nestedIndent = formatter.renderIndent();

        formatter.decreaseNesting();

        const fields = node.vMembers.map((n) => nestedIndent + writer.write(n, fragments) + ";");

        return "{" + wrap + fields.join(wrap) + wrap + currentIndent + "}";
    }
}

class ModifierDefinitionWriter implements ASTNodeWriter {
    write(node: ModifierDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const header = this.getHeader(node, writer, fragments);

        if (node.vBody === undefined) {
            return header + ";";
        }

        const body = writer.write(node.vBody, fragments);

        return header + " " + body;
    }

    private getHeader(
        node: ModifierDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const isGte06 = gte(writer.targetCompilerVersion, "0.6.0");

        const args = writer.write(node.vParameters, fragments);
        const result = ["modifier", node.name + args];

        if (isGte06) {
            if (node.virtual) {
                result.push("virtual");
            }

            if (node.vOverrideSpecifier) {
                const overrides = writer.write(node.vOverrideSpecifier, fragments);

                result.push(overrides);
            }
        }

        if (node.documentation) {
            const docs =
                node.documentation instanceof StructuredDocumentation
                    ? writer.write(node.documentation, fragments)
                    : StructuredDocumentationWriter.render(node.documentation, writer.formatter);

            return docs + result.join(" ");
        }

        return result.join(" ");
    }
}

class ModifierInvocationWriter implements ASTNodeWriter {
    write(node: ModifierInvocation, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const name = writer.write(node.vModifierName, fragments);
        const args = node.vArguments.map((arg) => writer.write(arg, fragments));

        return name + "(" + args.join(", ") + ")";
    }
}

class OverrideSpecifierWriter implements ASTNodeWriter {
    write(node: OverrideSpecifier, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        if (node.vOverrides.length) {
            const overrides = node.vOverrides.map((type) => writer.write(type, fragments));

            return "override(" + overrides.join(", ") + ")";
        }

        return "override";
    }
}

class FunctionDefinitionWriter implements ASTNodeWriter {
    write(node: FunctionDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const header = this.getHeader(node, writer, fragments);
        const body = this.getBody(node, writer, fragments);

        if (body === undefined) {
            return header + ";";
        }

        return header + " " + body;
    }

    private getHeader(
        node: FunctionDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
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

        const args = writer.write(node.vParameters, fragments);
        const result = [name + args];

        if (isGte06) {
            if (node.virtual) {
                result.push("virtual");
            }

            if (node.vOverrideSpecifier) {
                const overrides = writer.write(node.vOverrideSpecifier, fragments);

                result.push(overrides);
            }
        }

        if (!((isGte07 && node.isConstructor) || isFileLevel)) {
            result.push(node.visibility);
        }

        if (node.stateMutability !== FunctionStateMutability.NonPayable) {
            result.push(node.stateMutability);
        }

        if (node.vModifiers.length) {
            const mods = node.vModifiers.map((m) => writer.write(m, fragments));

            result.push(...mods);
        }

        if (node.vReturnParameters.vParameters.length) {
            const rets = writer.write(node.vReturnParameters, fragments);

            result.push("returns", rets);
        }

        if (node.documentation) {
            const docs =
                node.documentation instanceof StructuredDocumentation
                    ? writer.write(node.documentation, fragments)
                    : StructuredDocumentationWriter.render(node.documentation, writer.formatter);

            return docs + result.join(" ");
        }

        return result.join(" ");
    }

    private getBody(
        node: FunctionDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string | undefined {
        return node.vBody ? writer.write(node.vBody, fragments) : undefined;
    }
}

class UsingForDirectiveWriter implements ASTNodeWriter {
    write(node: UsingForDirective, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const library = writer.write(node.vLibraryName, fragments);
        const type = node.vTypeName ? writer.write(node.vTypeName, fragments) : "*";

        return "using " + library + " for " + type + ";";
    }
}

class EnumValueWriter implements ASTNodeWriter {
    write(node: EnumValue): string {
        return node.name;
    }
}

class EnumDefinitionWriter implements ASTNodeWriter {
    write(node: EnumDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        return "enum " + node.name + " " + this.getBody(node, writer, fragments);
    }

    private getBody(
        node: EnumDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const values = node.vMembers.map((v) => writer.write(v, fragments));

        return "{ " + values.join(", ") + " }";
    }
}

class InheritanceSpecifierWriter implements ASTNodeWriter {
    write(node: InheritanceSpecifier, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const name = writer.write(node.vBaseType, fragments);

        if (node.vArguments.length) {
            const args = node.vArguments.map((arg) => writer.write(arg, fragments));

            return name + "(" + args.join(", ") + ")";
        }

        return name;
    }
}

class ContractDefinitionWriter implements ASTNodeWriter {
    write(node: ContractDefinition, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const header = this.getHeader(node, writer, fragments);
        const body = this.getBody(node, writer, fragments);

        return header + " " + body;
    }

    private getHeader(
        node: ContractDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const result = [];

        if (gte(writer.targetCompilerVersion, "0.6.0") && node.abstract) {
            result.push("abstract");
        }

        result.push(node.kind);
        result.push(node.name);

        if (node.vInheritanceSpecifiers.length) {
            const specs = node.vInheritanceSpecifiers.map((spec) => writer.write(spec, fragments));

            result.push(`is ${specs.join(", ")}`);
        }

        if (node.documentation) {
            const docs =
                node.documentation instanceof StructuredDocumentation
                    ? writer.write(node.documentation, fragments)
                    : StructuredDocumentationWriter.render(node.documentation, writer.formatter);

            return docs + result.join(" ");
        }

        return result.join(" ");
    }

    private getBody(
        node: ContractDefinition,
        writer: ASTWriter,
        fragments: Map<ASTNode, string>
    ): string {
        const formatter = writer.formatter;

        const wrap = formatter.renderWrap();

        const writeFn = (n: ASTNode) => formatter.renderIndent() + writer.write(n, fragments);
        const writeLineFn = (n: ASTNode) => writeFn(n) + wrap;

        const result = [];

        formatter.increaseNesting();

        if (node.vUsingForDirectives.length) {
            result.push(...node.vUsingForDirectives.map(writeFn), "");
        }

        if (node.vEnums.length) {
            result.push(...node.vEnums.map(writeFn), "");
        }

        if (node.vEvents.length) {
            result.push(...node.vEvents.map(writeFn), "");
        }

        if (node.vStructs.length) {
            result.push(...node.vStructs.map(writeLineFn));
        }

        if (node.vStateVariables.length) {
            result.push(...node.vStateVariables.map((n) => writeFn(n) + ";"), "");
        }

        if (node.vModifiers.length) {
            result.push(...node.vModifiers.map(writeLineFn));
        }

        if (node.vFunctions.length) {
            result.push(...node.vFunctions.map(writeLineFn));
        }

        formatter.decreaseNesting();

        if (result.length) {
            const indent = formatter.renderIndent();

            return "{" + wrap + result.join(wrap).trimRight() + wrap + indent + "}";
        }

        return "{}";
    }
}

class ImportDirectiveWriter implements ASTNodeWriter {
    write(node: ImportDirective): string {
        if (node.unitAlias) {
            return `import "${node.file}" as ${node.unitAlias};`;
        }

        if (node.vSymbolAliases.length) {
            const entries: string[] = [];

            for (const [origin, alias] of node.vSymbolAliases) {
                const symbol = origin instanceof ImportDirective ? origin.unitAlias : origin.name;

                entries.push(alias !== undefined ? symbol + " as " + alias : symbol);
            }

            return `import { ${entries.join(", ")} } from "${node.file}";`;
        }

        return `import "${node.file}";`;
    }
}

class PragmaDirectiveWriter implements ASTNodeWriter {
    write(node: PragmaDirective): string {
        return `pragma ${node.vIdentifier} ${node.vValue};`;
    }
}

class SourceUnitWriter implements ASTNodeWriter {
    write(node: SourceUnit, writer: ASTWriter, fragments: Map<ASTNode, string>): string {
        const wrap = writer.formatter.renderWrap();

        const writeFn = (n: ASTNode) => writer.write(n, fragments);
        const writeLineFn = (n: ASTNode) => writer.write(n, fragments) + wrap;

        const result = [];

        if (node.vPragmaDirectives.length) {
            result.push(...node.vPragmaDirectives.map(writeFn), "");
        }

        if (node.vImportDirectives.length) {
            result.push(...node.vImportDirectives.map(writeFn), "");
        }

        result.push(...node.vEnums.map(writeLineFn), ...node.vStructs.map(writeLineFn));

        if (node.vVariables.length) {
            result.push(...node.vVariables.map((n) => writeFn(n) + ";"), "");
        }

        result.push(...node.vFunctions.map(writeLineFn), ...node.vContracts.map(writeLineFn));

        return result.join(wrap).trimRight();
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
