import expect from "expect";
import { lt } from "semver";
import {
    AnyResolvable,
    assert,
    ASTKind,
    ASTReader,
    CompilerKind,
    CompilerVersions08,
    compileSol,
    ContractDefinition,
    detectCompileErrors,
    ErrorDefinition,
    EventDefinition,
    FunctionDefinition,
    FunctionLikeType,
    FunctionType,
    generalizeType,
    InferType,
    PossibleCompilerKinds,
    resolveAny,
    SourceUnit,
    VariableDeclaration
} from "../../../src";

const samples: Array<[string, string]> = [
    ["test/samples/solidity/getters_08.sol", CompilerVersions08[CompilerVersions08.length - 1]],
    ["test/samples/solidity/getters_07.sol", "0.7.6"],
    ["test/samples/solidity/getters_07_abiv1.sol", "0.7.6"],
    ["test/samples/solidity/latest_06.sol", "0.6.12"],
    ["test/samples/solidity/latest_07.sol", "0.7.6"],
    ["test/samples/solidity/latest_08.sol", CompilerVersions08[CompilerVersions08.length - 1]],
    ["test/samples/solidity/compile_04.sol", "0.4.26"],
    ["test/samples/solidity/compile_05.sol", "0.5.17"],
    ["test/samples/solidity/compile_06.sol", "0.6.12"],
    ["test/samples/solidity/signatures.sol", "0.8.7"]
];

function resolveOne(
    name: string,
    contractName: string,
    unit: SourceUnit,
    inference: InferType
): AnyResolvable | undefined {
    const contracts = [...resolveAny(contractName, unit, inference, true)];

    assert(contracts.length === 1, `Contract ${contractName} not found in ${unit.sourceEntryKey}`);

    const contract = contracts[0] as ContractDefinition;
    const defs = [...resolveAny(name, contract, inference, true)];

    if (defs.length === 0) {
        return undefined;
    }

    assert(
        defs.length === 1,
        "Unexpected number of entries ({0}) for {1} in contract {2}: {3}",
        defs.length,
        name,
        contract.name,
        defs
    );

    return defs[0];
}

describe("Check canonical signatures are generated correctly", () => {
    for (const [sample, compilerVersion] of samples) {
        for (const kind of PossibleCompilerKinds) {
            it(`[${kind}] ${sample}`, async () => {
                const result = await compileSol(
                    sample,
                    "auto",
                    undefined,
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

                const inference = new InferType(compilerVersion);

                const runTestsHelper = (
                    contractName: string,
                    functionHashes: any,
                    abiData: any
                ) => {
                    for (const expectedSignature in functionHashes) {
                        const defName = expectedSignature.slice(0, expectedSignature.indexOf("("));
                        const def = resolveOne(defName, contractName, unit, inference);

                        if (def === undefined) {
                            continue;
                        }

                        let signature: string;

                        if (
                            def instanceof VariableDeclaration ||
                            def instanceof FunctionDefinition
                        ) {
                            signature = inference.signature(def);
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

                        const def = resolveOne(abiEntry.name, contractName, unit, inference);

                        if (def === undefined) {
                            continue;
                        }

                        let funT: FunctionType | FunctionLikeType;

                        if (def instanceof VariableDeclaration) {
                            funT = inference.getterFunType(def);
                        } else if (def instanceof FunctionDefinition) {
                            funT = inference.funDefToType(def);
                        } else if (def instanceof EventDefinition) {
                            funT = inference.eventDefToType(def);
                        } else if (def instanceof ErrorDefinition) {
                            funT = inference.errDefToType(def);
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
                            assert(
                                funT instanceof FunctionType,
                                "Expected function type, got {0} for {1}",
                                funT,
                                def
                            );

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
