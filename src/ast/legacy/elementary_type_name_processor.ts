import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { LegacyTypeNameProcessor } from "./type_name_processor";

export class LegacyElementaryTypeNameProcessor extends LegacyTypeNameProcessor<ElementaryTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ElementaryTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);
        const attributes = raw.attributes;

        const name: string = attributes.name;
        const stateMutability: "nonpayable" | "payable" =
            "stateMutability" in attributes ? attributes.stateMutability : "nonpayable";

        return [id, src, type, typeString, name, stateMutability, raw];
    }
}
