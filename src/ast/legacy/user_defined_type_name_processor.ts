import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { LegacyTypeNameProcessor } from "./type_name_processor";

export class LegacyUserDefinedTypeNameProcessor extends LegacyTypeNameProcessor<UserDefinedTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UserDefinedTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const name: string = attributes.name;
        const referencedDeclaration: number = attributes.referencedDeclaration;

        return [id, src, type, typeString, name, referencedDeclaration, undefined, raw];
    }
}
