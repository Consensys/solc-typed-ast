import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulExpression, YulTypedName, YulVariableDeclaration } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulVariableDeclarationProcessor extends ModernNodeProcessor<YulVariableDeclaration> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulVariableDeclaration> {
        const [id, src] = super.process(reader, config, raw);

        const variables = reader.convertArray(raw.variables, config) as YulTypedName[];
        const value = reader.convert(raw.value, config) as YulExpression;

        return [id, src, variables, value, undefined, raw];
    }
}
