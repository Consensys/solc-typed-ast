// Need the ts-nocheck to suppress the noUnusedLocals errors in the generated parser
export enum TopLevelNodeKind {
    Pragma = "pragma",
    Import = "import",
    Constant = "constant",
    Function = "function",
    Contract = "contract",
    Struct = "struct",
    Enum = "enum",
    UserValueType = "userValueType",
    Error = "error"
}

export type TopLevelNodeLocation = IFileRange;

export interface TopLevelNode<T extends TopLevelNodeKind> {
    kind: T;
    location: TopLevelNodeLocation;
}

export interface TLPragma extends TopLevelNode<TopLevelNodeKind.Pragma> {
    name: string;
    value: string;
}

export interface SymbolDesc {
    name: string;
    alias: string | null;
}

export interface TLImportDirective extends TopLevelNode<TopLevelNodeKind.Import> {
    path: string;
    symbols: SymbolDesc[];
    unitAlias: string | null;
}

export interface TLConstant extends TopLevelNode<TopLevelNodeKind.Constant> {
    name: string;
    value: string;
}

export interface TLFreeFunction extends TopLevelNode<TopLevelNodeKind.Function> {
    name: string;
    args: string;
    mutability: string;
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

export interface TLEnumDefinition extends TopLevelNode<TopLevelNodeKind.Enum> {
    name: string;
    body: string;
}

export interface TLUserValueType extends TopLevelNode<TopLevelNodeKind.UserValueType> {
    name: string;
    value_type: string;
}

export interface TLErrorDefinition extends TopLevelNode<TopLevelNodeKind.Error> {
    name: string;
    args: string;
}

export function parseTopLevelDefinitions(contents: string): Array<TopLevelNode<TopLevelNodeKind>> {
    return parse(contents);
}