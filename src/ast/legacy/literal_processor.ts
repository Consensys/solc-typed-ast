import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { EtherUnit, LiteralKind, TimeUnit } from "../constants";
import { Literal } from "../implementation/expression/literal";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyLiteralProcessor extends LegacyExpressionProcessor<Literal> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof Literal> {
        const [id, src, type, typeString] = super.process(reader, config, raw);

        const attributes = raw.attributes;

        const kind: LiteralKind = attributes.token;
        const hexValue: string = attributes.hexvalue;
        const value: string = attributes.value;
        const subdenomination: TimeUnit | EtherUnit | undefined = attributes.subdenomination
            ? attributes.subdenomination
            : undefined;

        return [id, src, type, typeString, kind, hexValue, value, subdenomination, raw];
    }
}
