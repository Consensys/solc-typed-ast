export enum FileLevelNodeKind {
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

// @ts-ignore
export type FileLevelNodeLocation = IFileRange;

export interface FileLevelNode<T extends FileLevelNodeKind> {
    kind: T;
    location: FileLevelNodeLocation;
}

export interface FLPragma extends FileLevelNode<FileLevelNodeKind.Pragma> {
    name: string;
    value: string;
}

export interface SymbolDesc {
    name: string;
    alias: string | null;
}

export interface FLImportDirective extends FileLevelNode<FileLevelNodeKind.Import> {
    path: string;
    symbols: SymbolDesc[];
    unitAlias: string | null;
}

export interface FLConstant extends FileLevelNode<FileLevelNodeKind.Constant> {
    name: string;
    value: string;
}

export interface FLFreeFunction extends FileLevelNode<FileLevelNodeKind.Function> {
    name: string;
    args: string;
    mutability: string;
    returns: string | null;
    body: string;
}

export interface FLContractDefinition extends FileLevelNode<FileLevelNodeKind.Contract> {
    abstract: boolean;
    contractKind: "contract" | "library" | "interface";
    name: string;
    bases: string | null;
    body: string;
}

export interface FLStructDefinition extends FileLevelNode<FileLevelNodeKind.Struct> {
    name: string;
    body: string;
}

export interface FLEnumDefinition extends FileLevelNode<FileLevelNodeKind.Enum> {
    name: string;
    body: string;
}

export interface FLUserValueType extends FileLevelNode<FileLevelNodeKind.UserValueType> {
    name: string;
    valueType: string;
}

export interface FLErrorDefinition extends FileLevelNode<FileLevelNodeKind.Error> {
    name: string;
    args: string;
}

export function parseFileLevelDefinitions(contents: string): Array<FileLevelNode<FileLevelNodeKind>> {
    // @ts-ignore
    return parse(contents);
}