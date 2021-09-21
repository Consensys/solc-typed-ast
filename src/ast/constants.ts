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

export enum CompilationOutput {
    AST = "ast",
    ABI = "abi",
    DEVDOC = "devdoc",
    USERDOC = "userdoc",
    METADATA = "metadata",
    IR = "ir",
    IR_OPTIMIZED = "irOptimized",
    STORAGE_LAYOUT = "storageLayout",
    EVM = "evm",
    EVM_ASSEMBLY = "evm.assembly",
    EVM_LEGACY_ASSEMBLY = "evm.legacyAssembly",
    EVM_BYTECODE = "evm.bytecode",
    EVM_BYTECODE_OBJECT = "evm.bytecode.object",
    EVM_BYTECODE_OPCODES = "evm.bytecode.opcodes",
    EVM_BYTECODE_SOURCEMAP = "evm.bytecode.sourceMap",
    EVM_BYTECODE_LINKREFERENCES = "evm.bytecode.linkReferences",
    EVM_BYTECODE_GENERATEDSOURCES = "evm.bytecode.generatedSources",
    EVM_DEPLOYEDBYTECODE_IMMUTABLEREFERENCES = "evm.deployedBytecode.immutableReferences",
    EVM_METHODIDENTIFIERS = "evm.methodIdentifiers",
    EVM_GASESTIMATES = "evm.gasEstimates",
    EWASM_WAST = "ewasm.wast",
    EWASM_WASM = "ewasm.wasm",
    ALL = "*"
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

export const PossibleCompilationOutputs = new Set<string>(Object.values(CompilationOutput));
