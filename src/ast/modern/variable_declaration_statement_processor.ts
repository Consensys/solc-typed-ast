import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { VariableDeclaration } from "../implementation/declaration/variable_declaration";
import { Expression } from "../implementation/expression/expression";
import { VariableDeclarationStatement } from "../implementation/statement/variable_declaration_statement";
import { ModernNodeProcessor } from "./node_processor";

const declarationsFilterFn = (declaration: unknown | null) => declaration !== null;

export class ModernVariableDeclarationStatementProcessor extends ModernNodeProcessor<VariableDeclarationStatement> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof VariableDeclarationStatement> {
        const [id, src, type] = super.process(reader, config, raw);

        const assignments: Array<number | null> = raw.assignments;

        const declarations = reader.convertArray(
            raw.declarations.filter(declarationsFilterFn),
            config
        ) as VariableDeclaration[];

        const initialValue = raw.initialValue
            ? (reader.convert(raw.initialValue, config) as Expression)
            : undefined;

        return [id, src, type, assignments, declarations, initialValue, raw];
    }
}
