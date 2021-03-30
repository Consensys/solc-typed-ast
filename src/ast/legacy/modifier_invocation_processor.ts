import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { Expression } from "../implementation/expression/expression";
import { Identifier } from "../implementation/expression/identifier";
import { ModifierInvocation } from "../implementation/meta/modifier_invocation";
import { LegacyNodeProcessor } from "./node_processor";

export class LegacyModifierInvocationProcessor extends LegacyNodeProcessor<ModifierInvocation> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof ModifierInvocation> {
        const [id, src, type] = super.process(reader, config, raw);

        const [modifierName, ...args] = reader.convertArray(raw.children, config) as [
            Identifier,
            ...Expression[]
        ];

        return [id, src, type, modifierName, args, undefined, raw];
    }
}
