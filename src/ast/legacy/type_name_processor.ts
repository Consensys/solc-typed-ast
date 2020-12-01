import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { TypeName, TypeNameConstructor } from "../implementation/type/type_name";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyTypeNameProcessor<T extends TypeName> extends LegacyNodeProcessor<T> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<TypeNameConstructor<T>> {
        const [id, src, type] = super.process(reader, config, raw);

        const typeString: string = raw.attributes.type;

        return [id, src, type, typeString, raw];
    }
}
