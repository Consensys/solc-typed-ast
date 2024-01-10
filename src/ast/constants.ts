export enum ExternalReferenceType {
    UserDefined = "userDefined",
    Builtin = "builtin"
}

export enum DataLocation {
    Storage = "storage",
    Memory = "memory",
    CallData = "calldata",
    Default = "default"
}

export enum FunctionVisibility {
    External = "external",
    Public = "public",
    Internal = "internal",
    Private = "private",
    Default = "default"
}

export enum FunctionStateMutability {
    Pure = "pure",
    View = "view",
    Constant = "constant",
    Payable = "payable",
    NonPayable = "nonpayable"
}

export enum StateVariableVisibility {
    Public = "public",
    Internal = "internal",
    Private = "private",
    Default = "default"
}

export enum Mutability {
    Mutable = "mutable",
    Immutable = "immutable",
    Constant = "constant"
}

export enum ContractKind {
    Contract = "contract",
    Library = "library",
    Interface = "interface"
}

export enum FunctionKind {
    Constructor = "constructor",
    Function = "function",
    Receive = "receive",
    Fallback = "fallback",
    Free = "freeFunction"
}

export enum FunctionCallKind {
    FunctionCall = "functionCall",
    TypeConversion = "typeConversion",
    StructConstructorCall = "structConstructorCall"
}

export enum ModifierInvocationKind {
    ModifierInvocation = "modifierInvocation",
    BaseConstructorSpecifier = "baseConstructorSpecifier"
}

export enum LiteralKind {
    Number = "number",
    Bool = "bool",
    String = "string",
    HexString = "hexString",
    UnicodeString = "unicodeString"
}

export enum EtherUnit {
    Wei = "wei",
    GWei = "gwei",
    Szabo = "szabo",
    Finney = "finney",
    Ether = "ether"
}

export enum TimeUnit {
    Seconds = "seconds",
    Minutes = "minutes",
    Hours = "hours",
    Days = "days",
    Weeks = "weeks",
    Years = "years"
}

export enum RawCommentKind {
    SingleLineComment = "single_line",
    BlockComment = "block_comment",
    LineGroupNatSpec = "line_group_natspec",
    BlockNatSpec = "block_natspec"
}

export const PossibleDataLocations = new Set<string>(Object.values(DataLocation));

export const PossibleFunctionVisibilities = new Set<string>(Object.values(FunctionVisibility));

export const PossibleFunctionStateMutabilities = new Set<string>(
    Object.values(FunctionStateMutability)
);

export const PossibleStateVariableVisibilities = new Set<string>(
    Object.values(StateVariableVisibility)
);

export const PossibleMutabilities = new Set<string>(Object.values(Mutability));

export const PossibleContractKinds = new Set<string>(Object.values(ContractKind));

export const PossibleFunctionKinds = new Set<string>(Object.values(FunctionKind));

export const PossibleFunctionCallKinds = new Set<string>(Object.values(FunctionCallKind));

export const PossibleLiteralKinds = new Set<string>(Object.values(LiteralKind));

export const PossibleEtherUnits = new Set<string>(Object.values(EtherUnit));

export const PossibleTimeUnits = new Set<string>(Object.values(TimeUnit));
