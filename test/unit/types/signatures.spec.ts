import expect from "expect";
import {
    compileSol,
    detectCompileErrors,
    ASTReader,
    ASTKind,
    resolveAny,
    assert,
    VariableDeclaration,
    FunctionDefinition,
    FunctionType,
    generalizeType
} from "../../../src";
import { ABIEncoderVersion } from "../../../src/types/abi";

const samples: Array<[string, string, ABIEncoderVersion]> = [
    ["test/samples/solidity/getters_08.sol", "0.8.7", ABIEncoderVersion.V2],
    ["test/samples/solidity/getters_07.sol", "0.7.6", ABIEncoderVersion.V2],
    ["test/samples/solidity/getters_07_abiv1.sol", "0.7.6", ABIEncoderVersion.V1]
];

describe("Check canonical signatures are generated correctly", () => {
    for (const [sample, compilerVersion, encoderVer] of samples) {
        it(`Sample ${sample}`, () => {
            const result = compileSol(sample, "auto", []);

            expect(result.compilerVersion).toEqual(compilerVersion);
            const errors = detectCompileErrors(result.data);

            expect(errors).toHaveLength(0);

            const data = result.data;

            const reader = new ASTReader();
            const sourceUnits = reader.read(data, ASTKind.Any);
            const unit = sourceUnits[0];

            for (const fileName in data.contracts) {
                for (const contractName in data.contracts[fileName]) {
                    const contractData = data.contracts[fileName][contractName];
                    const functionHashes = contractData.evm.methodIdentifiers;

                    for (const expectedSignature in functionHashes) {
                        const defName = expectedSignature.slice(0, expectedSignature.indexOf("("));
                        const fqDefName = `${contractName}.${defName}`;
                        const defs = [...resolveAny(fqDefName, unit, compilerVersion, true)];
                        assert(defs.length == 1, ``);
                        const def = defs[0];

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

                    for (const abiEntry of contractData.abi) {
                        const fqDefName = `${contractName}.${abiEntry.name}`;
                        const defs = [...resolveAny(fqDefName, unit, compilerVersion, true)];
                        assert(defs.length == 1, ``);
                        const def = defs[0];

                        let funT: FunctionType;

                        if (def instanceof VariableDeclaration) {
                            funT = def.getterFunType();
                        } else if (def instanceof FunctionDefinition) {
                            continue; // @todo add and test a 'canonicalType' method for `FunctionDefinition`s as well
                        } else {
                            throw new Error(`NYI: ${def.print()}`);
                        }

                        expect(funT.parameters.length).toEqual(abiEntry.inputs.length);
                        for (let i = 0; i < funT.parameters.length; i++) {
                            expect(generalizeType(funT.parameters[i])[0].pp()).toEqual(
                                abiEntry.inputs[i].internalType
                            );
                        }

                        expect(funT.returns.length).toEqual(abiEntry.outputs.length);
                        for (let i = 0; i < funT.returns.length; i++) {
                            expect(generalizeType(funT.returns[i])[0].pp()).toEqual(
                                abiEntry.outputs[i].internalType
                            );
                        }
                    }
                }
            }
        });
    }
});
