import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { MemberAccess } from "../implementation/expression/member_access";
import { LegacyExpressionProcessor } from "./expression_processor";

export class LegacyMemberAccessProcessor extends LegacyExpressionProcessor<MemberAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof MemberAccess> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const attributes = raw.attributes;

        const memberName: string = attributes.member_name;
        const referencedDeclaration: number = attributes.referencedDeclaration;

        const [expression] = reader.convertArray(raw.children, config) as [Expression];

        return [id, src, typeString, expression, memberName, referencedDeclaration, raw];
    }
}
