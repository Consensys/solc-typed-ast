import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { YulLiteralKind } from "../constants";
import { YulLiteral } from "../implementation/yul";
import { ModernNodeProcessor } from "./node_processor";

export class ModernYulLiteralProcessor extends ModernNodeProcessor<YulLiteral> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof YulLiteral> {
        const [id, src] = super.process(reader, config, raw);
        const kind: YulLiteralKind = raw.kind;
        const value: string = raw.value === undefined ? null : raw.value;
        const hexValue: string = raw.hexValue;
        const typeString: string = raw.type;

        return [id, src, kind, value, hexValue, typeString, raw];
    }
}
