import { ASTNode } from "../../ast_node";
import { FunctionCall } from "../expression/function_call";
import { Statement } from "./statement";

export class RevertStatement extends Statement {
    /**
     * A function call to the error definition
     */
    errorCall: FunctionCall;

    constructor(
        id: number,
        src: string,
        type: string,
        errorCall: FunctionCall,
        documentation?: string,
        raw?: any
    ) {
        super(id, src, type, documentation, raw);

        this.errorCall = errorCall;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.errorCall);
    }
}
