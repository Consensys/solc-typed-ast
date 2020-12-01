import { ASTNode } from "../../ast_node";
import { ParameterList } from "../meta/parameter_list";
import { Block } from "./block";
import { Statement } from "./statement";

export class TryCatchClause extends Statement {
    /**
     * Error string. Contains empty string if `Error` is not specified.
     */
    errorName: string;

    /**
     * Optional parameters
     */
    vParameters?: ParameterList;

    /**
     * Block of clause
     */
    vBlock: Block;

    constructor(
        id: number,
        src: string,
        type: string,
        errorName: string,
        block: Block,
        parameters?: ParameterList,
        raw?: any
    ) {
        super(id, src, type, raw);

        this.errorName = errorName;
        this.vParameters = parameters;
        this.vBlock = block;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vParameters, this.vBlock);
    }
}
