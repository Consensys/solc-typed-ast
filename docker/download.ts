import {
    CompilerKind,
    CompilerVersions,
    getCompilerForVersion,
    PossibleCompilerKinds
} from "../src";

/**
 * @see https://github.com/ethereum/solc-bin
 * @see https://binaries.soliditylang.org/
 */
async function main(): Promise<void> {
    for (const kind of PossibleCompilerKinds as Set<CompilerKind>) {
        for (const version of CompilerVersions) {
            console.log(`Downloading "${kind}" compiler ${version}`);

            await getCompilerForVersion(version, kind);
        }
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    });
