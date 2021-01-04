import { ASTNode } from "../../ast_node";
import { ContractDefinition } from "../declaration/contract_definition";
import { ModifierDefinition } from "../declaration/modifier_definition";
import { Expression } from "../expression/expression";
import { Identifier } from "../expression/identifier";
import { IdentifierPath } from "./identifier_path";

export class ModifierInvocation extends ASTNode {
    /**
     * An identifier of the referenced modifier declaration
     */
    vModifierName: Identifier | IdentifierPath;

    /**
     * An array of arguments, that are passed for the modifier call
     */
    vArguments: Expression[];

    constructor(
        id: number,
        src: string,
        type: string,
        modifierName: Identifier | IdentifierPath,
        args: Expression[],
        raw?: any
    ) {
        super(id, src, type, raw);

        this.vModifierName = modifierName;
        this.vArguments = args;

        this.acceptChildren();
    }

    get children(): readonly ASTNode[] {
        return this.pickNodes(this.vModifierName, this.vArguments);
    }

    /**
     * Reference to the `ModifierDefinition` or `ContractDefinition`.
     *
     * There is a possibility that constructor of the current contract
     * invokes a constructor of the super contract.
     * The `ContractDefinition` of a super contract is the value in such case.
     */
    get vModifier(): ModifierDefinition | ContractDefinition {
        return this.vModifierName.vReferencedDeclaration as ModifierDefinition | ContractDefinition;
    }
}
