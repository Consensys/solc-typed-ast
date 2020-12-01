import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Identifier } from "../implementation/expression/identifier";
import { ModifierInvocation } from "../implementation/meta/modifier_invocation";
import { ModernNodeProcessor } from "./node_processor";

export class ModernModifierInvocationProcessor extends ModernNodeProcessor<ModifierInvocation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ModifierInvocation> {
        const [id, src, type] = super.process(reader, config, raw);

        const modifierName = reader.convert(raw.modifierName, config) as Identifier;
        const args = raw.arguments
            ? (reader.convertArray(raw.arguments, config) as Expression[])
            : [];

        return [id, src, type, modifierName, args, raw];
    }
}
