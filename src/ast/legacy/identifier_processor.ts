import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Identifier } from "../implementation/expression/identifier";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyIdentifierProcessor extends LegacyExpressionProcessor<Identifier> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Identifier> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const attributes = raw.attributes;

        const name: string = attributes.value;
        const referencedDeclaration: number = attributes.referencedDeclaration;

        return [id, src, type, typeString, name, referencedDeclaration, raw];
    }
}
