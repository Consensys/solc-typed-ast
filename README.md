[![NodeJS CI](https://github.com/ConsenSys/solc-typed-ast/actions/workflows/node.js.yaml/badge.svg)](https://github.com/ConsenSys/solc-typed-ast/actions/workflows/node.js.yaml)
[![Coverage](https://codecov.io/gh/ConsenSys/solc-typed-ast/branch/master/graph/badge.svg?token=QDmbaGWza0)](https://codecov.io/gh/ConsenSys/solc-typed-ast)
[![Documentation](https://github.com/ConsenSys/solc-typed-ast/workflows/Build%20and%20release%20docs/badge.svg)](https://consensys.github.io/solc-typed-ast/)
[![npm](https://img.shields.io/npm/v/solc-typed-ast)](https://www.npmjs.com/package/solc-typed-ast)
[![npm downloads](https://img.shields.io/npm/dm/solc-typed-ast.svg)](https://www.npmjs.com/package/solc-typed-ast)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# solc-typed-ast

A TypeScript package providing a normalized typed Solidity AST along with the utilities necessary to generate the AST (from Solc) and traverse/manipulate it.

## Features

-   Various [Solidity](https://github.com/ethereum/solidity) compiler versions support, starting from **0.4.13**.
-   Various compiler selection strategies, including compiler auto-detection via `pragma solidity` directives in Solidity sources with possible fallback options.
-   Interaction with AST nodes, using type definitions.
-   Compensation of differences between legacy and compact Solidity AST.
-   Referenced AST nodes linking.
-   Easy tree traversal with siblings, parent/children relations, recursive walks and node selection via custom predicates.
-   XPath AST traversal (based on [jSel package](https://www.npmjs.com/package/jsel)).
-   Generating the source code from the AST.

## Installation

Package could be installed globally via following command:

```bash
npm install -g solc-typed-ast
```

Also it can be installed as the dependency:

```bash
npm install --save solc-typed-ast
```

## Usage

### Easy compiling

The package introduces easy and universal compiler invocation. Starting with **Solidity 0.4.13**, source compilation could be done universally:

```typescript
import { CompileFailedError, CompileResult, compileSol } from "solc-typed-ast";

let result: CompileResult;

try {
    result = await compileSol("sample.sol", "auto", []);
} catch (e) {
    if (e instanceof CompileFailedError) {
        console.error("Compile errors encountered:");

        for (const failure of e.failures) {
            console.error(`Solc ${failure.compilerVersion}:`);

            for (const error of failure.errors) {
                console.error(error);
            }
        }
    } else {
        console.error(e.message);
    }
}

console.log(result);
```

The second argument with the `"auto"` value specifies a compiler selection strategy. If `"auto"` is specified and source code contains valid `pragma solidity` directive, then compiler version will be automatically picked from it. If compile process will not succeed, the execution will fall back to _"compiler guessing"_: trying to compile source with a few different versions of the new and old Solidity compilers. The other option would be to specify a concrete supported compiler version string, like `"0.7.0"` for example. There is also a support for various compiler selection strategies, including used-defined custom ones (`CompilerVersionSelectionStrategy` interface implementations).

### Used compilers

Package supports switching between native binary Solc compilers and its WASM versions. The CLI option `--compiler-kind` and `kind` argument of `compile*()` functions family may be used for that purpose. Compilers **are downloaded on-demand** to the directory `.compiler_cache` at the package installation directory (by default). The compiler cache location may be customized by setting `SOL_AST_COMPILER_CACHE` environment variable to a custom path. For example:

```bash
SOL_AST_COMPILER_CACHE=~/.compiler_cache sol-ast-compile sample.sol --compiler-kind native --tree
```

or

```bash
export SOL_AST_COMPILER_CACHE=~/.compiler_cache

sol-ast-compile sample.sol --compiler-kind native --tree
```

#### Invalidation of downloaded compiler cache

If there is a need to invalidate the downloaded compiler cache, then follow next steps:

1. Locate `.compiler_cache` directory:

```bash
sol-ast-compile --locate-compiler-cache
```

2. Manually remove `list.json` files to invalidate list of available compilers, remove certain compilers, or remove entire directory. Missing pieces will be downloaded again.

### Typed universal AST

After the source is compiled and original compiler has provided the raw AST, the `ASTReader` could be used to read the typed universal AST:

```typescript
import { ASTReader } from "solc-typed-ast";

const reader = new ASTReader();
const sourceUnits = reader.read(result.data);

console.log("Used compiler version: " + result.compilerVersion);
console.log(sourceUnits[0].print());
```

The typed universal AST has following benefits:

-   It is _universal_ between legacy and compact AST. Solc changed AST format between releases, so dependent packages were either forced to migrate from one raw AST version to another or to build adaptive logic (such as implemented in this package).
-   It has TypeScript types and proper AST node classes hierarchy.
-   It has built-in tree traversal routines, like `walk()`, `getChildrenBySelector()`, `getParents()`, `getClosestParentBySelector()` and so on.

### Converting an AST back to source

One of the goals of each AST is to provide a way for programmatic modification. To do that, you could modify properties of the typed universal AST nodes. Then use the `ASTWriter` to write modified AST back to source code:

```typescript
import {
    ASTWriter,
    DefaultASTWriterMapping,
    LatestCompilerVersion,
    PrettyFormatter
} from "solc-typed-ast";

const formatter = new PrettyFormatter(4, 0);
const writer = new ASTWriter(
    DefaultASTWriterMapping,
    formatter,
    result.compilerVersion ? result.compilerVersion : LatestCompilerVersion
);

for (const sourceUnit of sourceUnits) {
    console.log("// " + sourceUnit.absolutePath);
    console.log(writer.write(sourceUnit));
}
```

### CLI tool

Package bundles a `sol-ast-compile` CLI tool to provide help with development process. It is able to compile the Solidity source and output short AST structure with following:

```bash
sol-ast-compile sample.sol --tree
```

Use `--help` to see all available features.

## Project overview

The project has following directory structure:

```
├── .compiler_cache             # Cache of downloaded compilers (by default, if not configured by SOL_AST_COMPILER_CACHE).
├── coverage                    # Test coverage report, produced by "npm test" command.
├── dist                        # Generated JavaScript sources for package distribution (produced by "npm run build" and published by "npm publish" commands).
├── docs                        # Project documentation and API reference, produced by "npm run docs:render" or "npm run docs:refresh" commands.
├── src                         # Original TypeScript sources.
│   ├── ast                     # AST-related definitions and logic:
│   │   ├── implementation      #   - Implemented universal AST nodes:
│   │   │   ├── declaration     #       - declarations or definitions;
│   │   │   ├── expression      #       - expressions;
│   │   │   ├── meta            #       - directives, units, specifiers and other information nodes;
│   │   │   ├── statement       #       - statements;
│   │   │   └── type            #       - type-related nodes.
│   │   ├── legacy              #   - Solc legacy raw AST processors, that are producing arguments for constrcuting universal AST nodes.
│   │   ├── modern              #   - Solc modern (or compact) raw AST processors, that are producing arguments for constrcuting universal AST nodes.
│   │   ├── postprocessing      #   - AST postprocessors to apply additional logic (fixes and discovery) during tree finalization process.
│   │   └── writing             #   - Components to convert universal AST nodes back to Solidity source code.
│   ├── bin                     # Executable files, that are shipped with the package and deployed via "npm install" or "npm link" commands.
│   ├── compile                 # Compile-related definitions and logic.
│   ├── misc                    # Miscellaneous functionality and utility modules.
│   └── types                   # Solc AST typeString parser and AST.
└── test                        # Tests:
    ├── integration             #   - Integration test suites.
    ├── samples                 #   - Solidity and compiler output JSON samples for the tests.
    └── unit                    #   - Unit test suites.
```

A key points for better understanding:

-   The `ASTNode` is generic implementation of universal AST node and a base class for all concrete node implementations, _except Yul nodes_.
-   The `ASTReader` takes raw Solc AST (legacy or modern) and produces universal AST.
-   The `ASTContext` provides node-to-node dynamic reference resolution map. The example of such reference would be a `vReferencedDeclaration` property of the `Identifier` node.
-   The `LegacyNodeProcessor` class, `ModernNodeProcessor` class and their descendant classes are raw-to-universal AST conversion bridge.
-   The compiling-related logic (located in `src/compile/*`) should not have imports from or any bindings to the universal AST (`src/ast/*`). Compile-related utils should be standalone as much as possible.

## Development installation

### Prerequisites

Preinstall NodeJS of [compatible version](/.nvmrc). If there is a need to run different NodeJS versions, consider using [NVM](https://github.com/nvm-sh/nvm) or similar tool for your platform.

### Clone and build

Clone repository, install and link:

```bash
git clone https://github.com/ConsenSys/solc-typed-ast.git
cd solc-typed-ast/
npm install
npm link
```

Prior to running the tests it would be better to setup local compiler cache:

```bash
sol-ast-compile --download-compilers native wasm
```

Supported platforms are listed here: https://github.com/ethereum/solc-bin

## Project documentation and API reference

The project documentation is contained in the `docs/` directory. It could be built via following command:

```bash
npm run docs:refresh
```

It is also published here: https://consensys.github.io/solc-typed-ast/

### The list of AST node types

The list of known AST node types can be found [here](https://github.com/ConsenSys/solc-typed-ast/blob/master/NODE_LIST.md).
