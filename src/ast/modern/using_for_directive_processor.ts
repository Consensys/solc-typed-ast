import { ASTReader, ASTReaderConfiguration } from "../ast_reader";
import { IdentifierPath } from "../implementation/meta";
import {
    UsingCustomizedOperator,
    UsingForDirective
} from "../implementation/meta/using_for_directive";
import { TypeName } from "../implementation/type/type_name";
import { UserDefinedTypeName } from "../implementation/type/user_defined_type_name";
import { ModernNodeProcessor } from "./node_processor";

export class ModernUsingForDirectiveProcessor extends ModernNodeProcessor<UsingForDirective> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<typeof UsingForDirective> {
        const [id, src] = super.process(reader, config, raw);

        const libraryName = raw.libraryName
            ? (reader.convert(raw.libraryName, config) as UserDefinedTypeName)
            : undefined;

        const functionList: Array<IdentifierPath | UsingCustomizedOperator> | undefined =
            raw.functionList
                ? raw.functionList.map((entry: any): IdentifierPath | UsingCustomizedOperator => {
                      if (entry.definition) {
                          return {
                              definition: reader.convert(
                                  entry.definition,
                                  config
                              ) as IdentifierPath,
                              operator: entry.operator
                          };
                      }

                      return reader.convert(entry.function, config) as IdentifierPath;
                  })
                : undefined;

        const typeName = raw.typeName
            ? (reader.convert(raw.typeName, config) as TypeName)
            : undefined;

        const isGlobal = raw.global === true;

        return [id, src, isGlobal, libraryName, functionList, typeName, raw];
    }
}
