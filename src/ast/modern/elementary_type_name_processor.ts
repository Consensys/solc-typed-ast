import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { ElementaryTypeName } from "../implementation/type/elementary_type_name";
import { ModernTypeNameProcessor } from "./type_name_processor";

export class ModernElementaryTypeNameProcessor extends ModernTypeNameProcessor<ElementaryTypeName> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ElementaryTypeName> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const name: string = raw.name;
        const stateMutability: "nonpayable" | "payable" =
            "stateMutability" in raw ? raw.stateMutability : "nonpayable";

        return [id, src, type, typeString, name, stateMutability, raw];
    }
}
