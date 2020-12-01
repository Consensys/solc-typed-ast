import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Expression } from "../implementation/expression/expression";
import { VariableDeclarationStatement } from "../implementation/statement/variable_declaration_statement";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyVariableDeclarationStatementProcessor extends LegacyNodeProcessor<VariableDeclarationStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof VariableDeclarationStatement> {
        const [id, src, type] = super.process(reader, config, raw);
        const attributes = raw.attributes;
        const children = reader.convertArray(raw.children, config);

        const assignments: Array<number | null> = attributes.assignments;

        const initialValue =
            attributes.initialValue === null ? undefined : (children.pop() as Expression);

        const declarations = children as VariableDeclaration[];

        return [id, src, type, assignments, declarations, initialValue, raw];
    }
}
