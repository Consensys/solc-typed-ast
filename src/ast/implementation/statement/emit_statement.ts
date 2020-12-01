import { ASTNode } from "../../ast_node";
import { FunctionCall } from "../expression/function_call";
import { Statement } from "./statement";

export class EmitStatement extends Statement {
    /**
     * A function call to the event definition
     */
    vEventCall: FunctionCall;

    constructor(id: number, src: string, type: string, eventCall: FunctionCall, raw?: any) {
        super(id, src, type, raw);

        this.vEventCall = eventCall;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vEventCall);
    }
}
