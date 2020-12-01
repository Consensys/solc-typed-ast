import { ASTNode } from "../../ast_node";
import { Expression } from "./expression";

export class MemberAccess extends Expression {
    /**
     * The name of the member, e.g. `push` in `someArray.push(1)`
     */
    memberName: string;

    /**
     * Id of the referenced declaration
     */
    referencedDeclaration: number;

    /**
     * The expression that is accessed e.g. `someArray` in `someArray.push(1)`
     */
    vExpression: Expression;

    constructor(
        id: number,
        src: string,
        type: string,
        typeString: string,
        expression: Expression,
        memberName: string,
        referencedDeclaration: number,
        raw?: any
    ) {
        super(id, src, type, typeString, raw);

        this.vExpression = expression;
        this.memberName = memberName;
        this.referencedDeclaration = referencedDeclaration;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vExpression);
    }

    /**
     * Reference to the declaration
     */
    get vReferencedDeclaration(): ASTNode | undefined {
        return this.requiredContext.locate(this.referencedDeclaration);
    }

    set vReferencedDeclaration(value: ASTNode | undefined) {
        if (value === undefined) {
            this.referencedDeclaration = -1;
        } else {
            if (!this.requiredContext.contains(value)) {
                throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
            }

            this.referencedDeclaration = value.id;
        }
    }
}
