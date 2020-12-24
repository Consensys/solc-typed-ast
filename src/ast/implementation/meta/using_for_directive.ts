import { ASTNode } from "../../ast_node";
import { TypeName } from "../type/type_name";
import { UserDefinedTypeName } from "../type/user_defined_type_name";
import { IdentifierPath } from "./identifier_path";

export class UsingForDirective extends ASTNode {
    /**
     * A library type
     */
    vLibraryName: UserDefinedTypeName | IdentifierPath;

    /**
     * A target type name that the library functions will apply to.
     */
    vTypeName?: TypeName;

    constructor(
        id: number,
        src: string,
        type: string,
        libraryName: UserDefinedTypeName | IdentifierPath,
        typeName?: TypeName,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.vLibraryName = libraryName;
        this.vTypeName = typeName;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vLibraryName, this.vTypeName);
    }
}
