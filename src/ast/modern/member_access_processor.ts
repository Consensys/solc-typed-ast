import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { MemberAccess } from "../implementation/expression/member_access";
import { ModernExpressionProcessor } from "./expression_processor";

export class ModernMemberAccessProcessor extends ModernExpressionProcessor<MemberAccess> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof MemberAccess> {
        const [id, src, typeString] = super.process(reader, config, raw);

        const memberName: string = raw.memberName;
        const referencedDeclaration: number = raw.referencedDeclaration;

        const expression = reader.convert(raw.expression, config) as Expression;

        return [id, src, typeString, expression, memberName, referencedDeclaration, raw];
    }
}
