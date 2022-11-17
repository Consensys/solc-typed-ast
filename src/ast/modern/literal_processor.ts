import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EtherUnit, LiteralKind, TimeUnit } from "../constants";
import { Literal } from "../implementation/expression/literal";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernLiteralProcessor extends ModernExpressionProcessor<Literal> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Literal> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const kind: LiteralKind = raw.kind;
        const hexValue: string = raw.hexValue;
        const value: string = raw.value ?? null;
        const subdenomination: TimeUnit | EtherUnit | undefined = raw.subdenomination
            ? raw.subdenomination
            : undefined;

        return [id, src, typeString, kind, hexValue, value, subdenomination, raw];
    }
}
