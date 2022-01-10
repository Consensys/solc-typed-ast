// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
// @ts-nocheck
export interface SymbolDesc {
    name: string;
    alias: string | null;
}

export interface ImportDirectiveDesc {
    path: string;
    unitAlias: string | undefined;
    symbolAliases: SymbolDesc[];
}

export enum TopLevelNodeKind {
    Comment = "comment",
    Import = "import",
    Constant = "constant",
    Function = "function",
    Contract = "contract",
    Struct = "struct"
}

export type TopLevelNodeLocation = IFileRange;

export interface TopLevelNode<T extends TopLevelNodeKind> {
    kind: T;
    location: TopLevelNodeLocation;
}

export interface TLConstant extends TopLevelNode<TopLevelNodeKind.Constant> {
    name: string;
    value: string;
}

export interface TLFreeFunction extends TopLevelNode<TopLevelNodeKind.Function> {
    name: string;
    args: string;
    qualifiers: string;
    returns: string | null;
    body: string;
}

export interface TLContractDefinition extends TopLevelNode<TopLevelNodeKind.Contract> {
    abstract: boolean;
    contract_kind: "contract" | "library" | "interface";
    name: string;
    bases: string | null;
    body: string;
}

export interface TLStructDefinition extends TopLevelNode<TopLevelNodeKind.Struct> {
    name: string;
    body: string;
}
