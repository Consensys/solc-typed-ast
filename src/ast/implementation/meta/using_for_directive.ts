import { ASTNode } from "../../ast_node";
import { TypeName } from "../type/type_name";
import { UserDefinedTypeName } from "../type/user_defined_type_name";
import { IdentifierPath } from "./identifier_path";

export interface UsingCustomizedOperator {
    definition: IdentifierPath;
    operator: string;
}

export class UsingForDirective extends ASTNode {
    /**
     * A library type name or identifier.
     * One of vLibraryName or vFunctionList should always be set.
     */
    vLibraryName?: UserDefinedTypeName | IdentifierPath;

    /**
     * Function list for file-level using-for directives.
     * One of vLibraryName or vFunctionList should always be set.
     */
    vFunctionList?: Array<IdentifierPath | UsingCustomizedOperator>;

    /**
     * A target type name that the library functions will apply to.
     */
    vTypeName?: TypeName;

    /**
     * Allows to apply vLibraryName or vFunctionList to the type everywhere,
     * where type is accessible.
     */
    isGlobal: boolean;

    constructor(
        id: number,
        src: string,
        isGlobal: boolean,
        libraryName?: UserDefinedTypeName | IdentifierPath,
        functionList?: Array<IdentifierPath | UsingCustomizedOperator>,
        typeName?: TypeName,
        raw?: any
    ) {
        super(id, src, raw);

        if (libraryName) {
            this.vLibraryName = libraryName;
        } else if (functionList) {
            this.vFunctionList = functionList;
        } else {
            throw new Error("One of vLibraryName or vFunctionList should always be set");
        }

        this.vTypeName = typeName;
        this.isGlobal = isGlobal;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        const result = [];

        if (this.vLibraryName) {
            result.push(this.vLibraryName);
        }

        if (this.vFunctionList) {
            for (const entry of this.vFunctionList) {
                result.push(entry instanceof IdentifierPath ? entry : entry.definition);
            }
        }

        if (this.vTypeName) {
            result.push(this.vTypeName);
        }

        return result;
    }
}
