import expect from "expect";
import { lt } from "semver";
import {
    AnyResolvable,
    assert,
    ASTKind,
    ASTReader,
    CompilerKind,
    compileSol,
    ContractDefinition,
    detectCompileErrors,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    FunctionStateMutability,
    FunctionType,
    FunctionVisibility,
    generalizeType,
    PossibleCompilerKinds,
    resolveAny,
    SourceUnit,
    VariableDeclaration,
    variableDeclarationToTypeNode
} from "../../../src";
import { ABIEncoderVersion } from "../../../src/types/abi";

const samples: Array<[string, string, ABIEncoderVersion]> = [
    ["test/samples/solidity/getters_08.sol", "0.8.7", ABIEncoderVersion.V2],
    ["test/samples/solidity/getters_07.sol", "0.7.6", ABIEncoderVersion.V2],
    ["test/samples/solidity/getters_07_abiv1.sol", "0.7.6", ABIEncoderVersion.V1],
    ["test/samples/solidity/latest_06.sol", "0.6.12", ABIEncoderVersion.V2],
    ["test/samples/solidity/latest_07.sol", "0.7.6", ABIEncoderVersion.V2],
    ["test/samples/solidity/latest_08.sol", "0.8.7", ABIEncoderVersion.V2],
    ["test/samples/solidity/compile_04.sol", "0.4.26", ABIEncoderVersion.V1],
    ["test/samples/solidity/compile_05.sol", "0.5.17", ABIEncoderVersion.V1],
    ["test/samples/solidity/compile_06.sol", "0.6.12", ABIEncoderVersion.V1],
    ["test/samples/solidity/library_signatures.sol", "0.8.7", ABIEncoderVersion.V2]
];

function resolveOne(
    name: string,
    contractName: string,
    unit: SourceUnit,
    compilerVersion: string
): AnyResolvable | undefined {
    const contracts = [...resolveAny(contractName, unit, compilerVersion, true)];

    assert(contracts.length === 1, `Contract ${contractName} not found in ${unit.sourceEntryKey}`);

    const contract = contracts[0] as ContractDefinition;

    const defs = [...resolveAny(name, contract, compilerVersion, true)];

    if (defs.length === 0) {
        return undefined;
    }

    assert(
        defs.length === 1,
        `Unexpected number of entries (${defs.length}) for ${name} in contract ${contract.name}: ${defs}`
    );

    return defs[0];
}

describe("Check canonical signatures are generated correctly", () => {
    for (const [sample, compilerVersion, encoderVer] of samples) {
        for (const kind of PossibleCompilerKinds) {
            it(`[${kind}] ${sample}`, async () => {
                const result = await compileSol(
                    sample,
                    "auto",
                    [],
                    undefined,
                    undefined,
                    kind as CompilerKind
                );

                expect(result.compilerVersion).toEqual(compilerVersion);

                const errors = detectCompileErrors(result.data);

                expect(errors).toHaveLength(0);

                const data = result.data;

                const reader = new ASTReader();
                const sourceUnits = reader.read(data, ASTKind.Any);
                const unit = sourceUnits[0];

                const runTestsHelper = (
                    contractName: string,
                    functionHashes: any,
                    abiData: any
                ) => {
                    for (const expectedSignature in functionHashes) {
                        const defName = expectedSignature.slice(0, expectedSignature.indexOf("("));
                        const def = resolveOne(defName, contractName, unit, compilerVersion);

                        if (def === undefined) {
                            continue;
                        }

                        let signature: string;

                        if (def instanceof VariableDeclaration) {
                            signature = def.getterCanonicalSignature(encoderVer);
                        } else if (def instanceof FunctionDefinition) {
                            signature = def.canonicalSignature(encoderVer);
                        } else {
                            throw new Error(`NYI: ${def.print()}`);
                        }

                        expect(signature).toEqual(expectedSignature);
                    }

                    /// 0.4.x doesn't report internal types in the ABI so we skip the ABI checks.
                    if (lt(compilerVersion, "0.5.0")) {
                        return;
                    }

                    for (const abiEntry of abiData) {
                        /// @todo fix the test so we can remove these
                        if (
                            abiEntry.type === "constructor" ||
                            abiEntry.type === "fallback" ||
                            abiEntry.type === "receive"
                        ) {
                            continue;
                        }

                        const def = resolveOne(abiEntry.name, contractName, unit, compilerVersion);

                        if (def === undefined) {
                            continue;
                        }

                        let funT: FunctionType;

                        if (def instanceof VariableDeclaration) {
                            funT = def.getterFunType();
                        } else if (def instanceof FunctionDefinition) {
                            funT = new FunctionType(
                                def.name,
                                def.vParameters.vParameters.map((param) =>
                                    variableDeclarationToTypeNode(param)
                                ),
                                def.vReturnParameters.vParameters.map((param) =>
                                    variableDeclarationToTypeNode(param)
                                ),
                                def.visibility,
                                def.stateMutability
                            );
                        } else if (def instanceof EventDefinition) {
                            funT = new FunctionType(
                                def.name,
                                def.vParameters.vParameters.map((param) =>
                                    variableDeclarationToTypeNode(param)
                                ),
                                [],
                                FunctionVisibility.Default,
                                FunctionStateMutability.View
                            );
                        } else if (def instanceof ErrorDefinition) {
                            funT = new FunctionType(
                                def.name,
                                def.vParameters.vParameters.map((param) =>
                                    variableDeclarationToTypeNode(param)
                                ),
                                [],
                                FunctionVisibility.Default,
                                FunctionStateMutability.View
                            );
                        } else {
                            throw new Error(`NYI: ${def.print()}`);
                        }

                        expect(funT.parameters.length).toEqual(abiEntry.inputs.length);

                        for (let i = 0; i < funT.parameters.length; i++) {
                            expect(generalizeType(funT.parameters[i])[0].pp()).toEqual(
                                abiEntry.inputs[i].internalType
                            );
                        }

                        if (abiEntry.type === "function") {
                            expect(funT.returns.length).toEqual(abiEntry.outputs.length);

                            for (let i = 0; i < funT.returns.length; i++) {
                                expect(generalizeType(funT.returns[i])[0].pp()).toEqual(
                                    abiEntry.outputs[i].internalType
                                );
                            }
                        }
                    }
                };

                for (const fileName in data.contracts) {
                    if ("functionHashes" in data.contracts[fileName]) {
                        /**
                         * Legacy compiler data structure
                         */
                        const contractName = fileName.slice(fileName.lastIndexOf(":") + 1);
                        const contractData = data.contracts[fileName];
                        const functionHashes = contractData.functionHashes;
                        const abiData = JSON.parse(contractData.interface);

                        runTestsHelper(contractName, functionHashes, abiData);
                    } else {
                        /**
                         * Modern compiler data structure
                         */
                        for (const contractName in data.contracts[fileName]) {
                            const contractData = data.contracts[fileName][contractName];
                            const functionHashes = contractData.evm.methodIdentifiers;
                            const abiData = contractData.abi;

                            runTestsHelper(contractName, functionHashes, abiData);
                        }
                    }
                }
            });
        }
    }
});
