import { StructuredDocumentation } from "../../meta/structured_documentation";
import { YulBlock } from "../statement/yul_block";
import { YulASTNode } from "../yul_ast_node";
import { YulTypedName } from "../expression";
import { YulStatement } from "./yul_statement";

export class YulFunctionDefinition extends YulStatement {
    /**
     * Node id of scoped block
     */
    scope: number;

    /**
     * Identifier of the function
     */
    name: string;

    /**
     * Optional documentation appearing above the function definition:
     * - Is `undefined` when not specified.
     * - Is type of `string` when specified and compiler version is older than `0.6.3`.
     * - Is instance of `StructuredDocumentation` when specified and compiler version is `0.6.3` or newer.
     */
    documentation?: string | StructuredDocumentation;

    /**
     * Function body block: can be empty if function is declared, but not implemented.
     * Always filled otherwise.
     */
    vBody: YulBlock;

    /**
     * A list of local variables that are declared and initialized with the input values
     */
    vParameters: YulTypedName[];

    /**
     * A list of local variables that are declared and returned to the caller
     */
    vReturnParameters: YulTypedName[];

    constructor(
        id: number,
        src: string,
        scope: number,
        name: string,
        // solc does not generate empty arrays if parameters are not populated
        parameters: YulTypedName[] = [],
        returnParameters: YulTypedName[] = [],
        body: YulBlock,
        documentation?: string | StructuredDocumentation,
        raw?: any
    ) {
        super(id, src, documentation, raw);

        this.scope = scope;
        this.name = name;
        this.documentation = documentation;

        this.vParameters = parameters;
        this.vReturnParameters = returnParameters;
        this.vBody = body;

        this.acceptChildren();
    }

    get children(): readonly YulASTNode[] {
        return this.pickNodes(
            this.documentation,
            this.vParameters,
            this.vReturnParameters,
            this.vBody
        );
    }

    /**
     * Reference to a scoped `ContractDefinition` if function is declared in contract.
     * Reference to a scoped `SourceUnit` if function is declared on file level
     * (since Solidity 0.7.1).
     */
    get vScope(): YulBlock {
        return this.requiredContext.locate(this.scope) as YulBlock;
    }

    set vScope(value: YulBlock) {
        if (!this.requiredContext.contains(value)) {
            throw new Error(`Node ${value.type}#${value.id} not belongs to a current context`);
        }

        this.scope = value.id;
    }
}
