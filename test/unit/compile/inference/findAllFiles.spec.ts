import expect from "expect";
import fse from "fs-extra";
import { join } from "path";
import { FileSystemResolver } from "../../../../src";
import { findAllFiles, normalizeImportPath } from "../../../../src/compile/inference";

const SAMPLES_DIR = join("test", "samples", "solidity");

const samples: Array<[string, string[]]> = [
    [
        join(SAMPLES_DIR, "latest_08.sol"),
        [join(SAMPLES_DIR, "latest_08.sol"), join(SAMPLES_DIR, "latest_imports_08.sol")]
    ],
    [
        join(SAMPLES_DIR, "resolving", "imports_and_source_unit_function_overloading.sol"),
        [
            join(SAMPLES_DIR, "resolving", "imports_and_source_unit_function_overloading.sol"),
            join(SAMPLES_DIR, "resolving", "boo.sol"),
            join(SAMPLES_DIR, "resolving", "foo.sol")
        ]
    ],
    [
        join(SAMPLES_DIR, "resolving", "id_paths.sol"),
        [
            join(SAMPLES_DIR, "resolving", "id_paths.sol"),
            join(SAMPLES_DIR, "resolving", "id_paths_lib.sol"),
            join(SAMPLES_DIR, "resolving", "id_paths_lib2.sol")
        ]
    ],
    [
        join(SAMPLES_DIR, "meta", "complex_imports", "c.sol"),
        [
            join(SAMPLES_DIR, "meta", "complex_imports", "c.sol"),
            join(SAMPLES_DIR, "meta", "complex_imports", "b.sol"),
            join(SAMPLES_DIR, "meta", "complex_imports", "a.sol")
        ]
    ],
    [
        join(SAMPLES_DIR, "meta", "imports", "A.sol"),
        [
            join(SAMPLES_DIR, "meta", "imports", "A.sol"),
            join(SAMPLES_DIR, "meta", "imports", "lib", "B.sol"),
            join(SAMPLES_DIR, "meta", "imports", "lib2", "C.sol"),
            join(SAMPLES_DIR, "meta", "imports", "lib2", "D.sol")
        ]
    ]
];

describe("findAllFiles() find all needed imports", () => {
    for (const [fileName, expectedAllFiles] of samples) {
        it(`All imports for ${fileName} should be ${expectedAllFiles.join(", ")}`, () => {
            const contents = fse.readFileSync(fileName).toString();
            const files = new Map<string, string>([[normalizeImportPath(fileName), contents]]);
            const additionalFiles = findAllFiles(files, [], [new FileSystemResolver()]);
            const allFiles = new Set([normalizeImportPath(fileName), ...additionalFiles.keys()]);
            expect(allFiles).toEqual(new Set(expectedAllFiles.map(normalizeImportPath)));
        });
    }
});
