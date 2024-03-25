export const CompilerVersions04 = [
    "0.4.13",
    "0.4.14",
    "0.4.15",
    "0.4.16",
    "0.4.17",
    "0.4.18",
    "0.4.19",
    "0.4.20",
    "0.4.21",
    "0.4.22",
    "0.4.23",
    "0.4.24",
    "0.4.25",
    "0.4.26"
];

export const CompilerVersions05 = [
    "0.5.0",
    "0.5.1",
    "0.5.2",
    "0.5.3",
    "0.5.4",
    "0.5.5",
    "0.5.6",
    "0.5.7",
    "0.5.8",
    "0.5.9",
    "0.5.10",
    "0.5.11",
    "0.5.12",
    "0.5.13",
    "0.5.14",
    "0.5.15",
    "0.5.16",
    "0.5.17"
];

export const CompilerVersions06 = [
    "0.6.0",
    "0.6.1",
    "0.6.2",
    "0.6.3",
    "0.6.4",
    "0.6.5",
    "0.6.6",
    "0.6.7",
    "0.6.8",
    "0.6.9",
    "0.6.10",
    "0.6.11",
    "0.6.12"
];

export const CompilerVersions07 = ["0.7.0", "0.7.1", "0.7.2", "0.7.3", "0.7.4", "0.7.5", "0.7.6"];

export const CompilerVersions08 = [
    "0.8.0",
    "0.8.1",
    "0.8.2",
    "0.8.3",
    "0.8.4",
    "0.8.5",
    "0.8.6",
    "0.8.7",
    "0.8.8",
    "0.8.9",
    "0.8.10",
    "0.8.11",
    "0.8.12",
    "0.8.13",
    "0.8.14",
    "0.8.15",
    "0.8.16",
    "0.8.17",
    "0.8.18",
    "0.8.19",
    "0.8.20",
    "0.8.21",
    "0.8.22",
    "0.8.23",
    "0.8.24",
    "0.8.25"
];

export const CompilerSeries = [
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08
];

export const CompilerVersions = [
    ...CompilerVersions04,
    ...CompilerVersions05,
    ...CompilerVersions06,
    ...CompilerVersions07,
    ...CompilerVersions08
];

export const LatestCompilerVersion = CompilerVersions[CompilerVersions.length - 1];

export enum CompilerKind {
    WASM = "wasm",
    Native = "native"
}

/**
 * Corresponds to the string constants used in "outputSelection" as described in
 * https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description
 */
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

export const PossibleCompilerKinds = new Set<string>(Object.values(CompilerKind));

export const PossibleCompilationOutputs = new Set<string>(Object.values(CompilationOutput));
