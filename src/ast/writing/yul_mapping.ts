import { YulNode } from "../implementation/statement/inline_assembly";
import { YulNodeWriter, YulWriter } from "./writer";

class YulBlockWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        if (node.statements.length === 0) {
            return "{}";
        }

        const formatter = writer.formatter;

        formatter.increaseNesting();

        const statements = node.statements.map(
            (stmt: YulNode) => formatter.renderIndent() + writer.write(stmt)
        );

        formatter.decreaseNesting();

        const wrap = formatter.renderWrap();
        const indent = formatter.renderIndent();

        return "{" + wrap + statements.join(wrap) + wrap + indent + "}";
    }
}

class YulLiteralWriter implements YulNodeWriter {
    write(node: YulNode): string {
        const value = node.kind === "string" ? '"' + node.value + '"' : node.value;

        return node.type !== "" ? value + ":" + node.type : value;
    }
}

class YulIdentifierWriter implements YulNodeWriter {
    write(node: YulNode): string {
        return node.name;
    }
}

class YulTypedNameWriter implements YulNodeWriter {
    write(node: YulNode): string {
        return node.type !== "" ? node.name + ":" + node.type : node.name;
    }
}

class YulFunctionCallWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const id = writer.write(node.functionName);
        const args = node.arguments.map((arg: YulNode) => writer.write(arg));

        return id + "(" + args.join(", ") + ")";
    }
}

class YulVariableDeclarationWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const vars = node.variables.map((v: YulNode) => writer.write(v));
        const rhs = node.value === null ? undefined : writer.write(node.value);
        const lhs = "let " + vars.join(", ");

        return rhs !== undefined ? lhs + " := " + rhs : lhs;
    }
}

class YulExpressionStatementWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        return writer.write(node.expression);
    }
}

class YulAssignmentWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const lhs = node.variableNames.map((v: YulNode) => writer.write(v));
        const rhs = writer.write(node.value);

        return lhs.join(", ") + " := " + rhs;
    }
}

class YulIfWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const condition = writer.write(node.condition);
        const body = writer.write(node.body);

        return "if " + condition + " " + body;
    }
}

class YulCaseWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const body = writer.write(node.body);

        if (node.value === "default") {
            return "default " + body;
        }

        const value = writer.write(node.value);

        return "case " + value + " " + body;
    }
}

class YulSwitchWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const expression = writer.write(node.expression);

        const formatter = writer.formatter;

        const cases = node.cases.map(
            (clause: YulNode) => formatter.renderIndent() + writer.write(clause)
        );

        const wrap = formatter.renderWrap();

        return "switch " + expression + wrap + cases.join(wrap);
    }
}

class YulContinueWriter implements YulNodeWriter {
    write(): string {
        return "continue";
    }
}

class YulBreakWriter implements YulNodeWriter {
    write(): string {
        return "break";
    }
}

class YulLeaveWriter implements YulNodeWriter {
    write(): string {
        return "leave";
    }
}

class YulForLoopWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const pre = writer.write(node.pre);
        const condition = writer.write(node.condition);
        const post = writer.write(node.post);
        const body = writer.write(node.body);

        return `for ${pre} ${condition} ${post} ${body}`;
    }
}

class YulFunctionDefinitionWriter implements YulNodeWriter {
    write(node: YulNode, writer: YulWriter): string {
        const args = node.parameters
            ? node.parameters.map((arg: any) => writer.write(arg))
            : undefined;

        const rets = node.returnVariables
            ? node.returnVariables.map((v: any) => writer.write(v))
            : undefined;

        const body = writer.write(node.body);

        const definition = ["function", node.name];

        definition.push(args ? "(" + args.join(", ") + ")" : "()");

        if (rets) {
            definition.push("-> " + rets.join(", "));
        }

        definition.push(body);

        return definition.join(" ");
    }
}

export const DefaultYulWriterMapping = new Map<string, YulNodeWriter>([
    ["YulBlock", new YulBlockWriter()],
    ["YulLiteral", new YulLiteralWriter()],
    ["YulIdentifier", new YulIdentifierWriter()],
    ["YulTypedName", new YulTypedNameWriter()],
    ["YulFunctionCall", new YulFunctionCallWriter()],
    ["YulVariableDeclaration", new YulVariableDeclarationWriter()],
    ["YulExpressionStatement", new YulExpressionStatementWriter()],
    ["YulAssignment", new YulAssignmentWriter()],
    ["YulIf", new YulIfWriter()],
    ["YulCase", new YulCaseWriter()],
    ["YulSwitch", new YulSwitchWriter()],
    ["YulContinue", new YulContinueWriter()],
    ["YulBreak", new YulBreakWriter()],
    ["YulLeave", new YulLeaveWriter()],
    ["YulForLoop", new YulForLoopWriter()],
    ["YulFunctionDefinition", new YulFunctionDefinitionWriter()]
]);
