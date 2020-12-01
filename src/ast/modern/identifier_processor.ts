import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Identifier } from "../implementation/expression/identifier";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernIdentifierProcessor extends ModernExpressionProcessor<Identifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Identifier> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const name: string = raw.name;
        const referencedDeclaration: number = raw.referencedDeclaration;

        return [id, src, type, typeString, name, referencedDeclaration, raw];
    }
}
