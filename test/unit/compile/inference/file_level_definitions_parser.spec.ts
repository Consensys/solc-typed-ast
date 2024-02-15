import { fail } from "assert";
import expect from "expect";
import fse from "fs-extra";
import { parseFileLevelDefinitions } from "../../../../src";
import { searchRecursive } from "../../../utils";

const good_samples: Array<[string, string, any]> = [
    // Imports
    ["import1", `import "a.sol";`, [{ path: "a.sol", unitAlias: null, symbols: [] }]],
    [
        "import2",
        `import {foo} from "a.sol";`,
        [{ path: "a.sol", symbols: [{ alias: null, name: "foo" }], unitAlias: null }]
    ],
    [
        "import3",
        `import {foo as bar} from "a.sol";`,
        [{ path: "a.sol", symbols: [{ alias: "bar", name: "foo" }], unitAlias: null }]
    ],
    ["import4", `import "a.sol" as boo;`, [{ path: "a.sol", symbols: [], unitAlias: "boo" }]],
    [
        "import5",
        `/*sup brah */ import "a.sol" as boo;`,
        [{ path: "a.sol", symbols: [], unitAlias: "boo" }]
    ],
    [
        "import6",
        `/*sup brah */ import /* import foo */ "a.sol" /* boo * */ as /* mo*o */ /**/ /* */ boo; // for realzies?`,
        [{ path: "a.sol", symbols: [], unitAlias: "boo" }]
    ],

    // Constants
    ["constant1", "uint constant a = 1;", [{ name: "a", kind: "constant", value: "1" }]],
    [
        "constant2",
        `string constant a = "asdfasd; nasdf (;)}{;/**/ // /*";`,
        [{ name: "a", kind: "constant", value: `"asdfasd; nasdf (;)}{;/**/ // /*"` }]
    ],
    [
        "constant3",
        `string constant a = 'asdfasd; nasdf (;)}{;/**/ // /*';`,
        [{ name: "a", kind: "constant", value: `'asdfasd; nasdf (;)}{;/**/ // /*'` }]
    ],
    [
        "invalid escape sequence (legacy)",
        `string constant a = '\\2';`,
        [{ name: "a", kind: "constant", value: `'\\2'` }]
    ],

    // Free functions
    [
        "free fun $foo$",
        `function $foo$(uint $arg) {}`,
        [
            {
                kind: "function",
                name: "$foo$",
                args: "(uint $arg)",
                mutability: "",
                returns: null,
                body: "{}"
            }
        ]
    ],
    [
        "free fun foo0",
        `function foo0() {}`,
        [{ kind: "function", name: "foo0", args: "()", mutability: "", returns: null, body: "{}" }]
    ],
    [
        "free fun foo1",
        `function foo1(uint x) {}`,
        [
            {
                kind: "function",
                name: "foo1",
                args: "(uint x)",
                mutability: "",
                returns: null,
                body: "{}"
            }
        ]
    ],
    [
        "free fun foo2",
        `function foo2(uint x) pure {}`,
        [
            {
                kind: "function",
                name: "foo2",
                args: "(uint x)",
                mutability: "pure",
                returns: null,
                body: "{}"
            }
        ]
    ],
    [
        "free fun foo3",
        `function foo3(uint x) returns (uint y) {}`,
        [
            {
                kind: "function",
                name: "foo3",
                args: "(uint x)",
                mutability: "",
                returns: "returns (uint y)",
                body: "{}"
            }
        ]
    ],
    [
        "free fun foo4",
        `function foo4(uint x) view returns (uint y) {}`,
        [
            {
                kind: "function",
                name: "foo4",
                args: "(uint x)",
                mutability: "view",
                returns: "returns (uint y)",
                body: "{}"
            }
        ]
    ],
    [
        "free fun foo5",
        `function foo5(uint x, uint[] memory y, mapping (uint => bytes) storage t) returns (mapping (uint => bytes) storage, string memory, bytes storage) {
    string memory x;
    bytes storage t1 = t[0];

    return (t, x, t1);
}`,
        [
            {
                kind: "function",
                name: "foo5",
                args: "(uint x, uint[] memory y, mapping (uint => bytes) storage t)",
                mutability: "",
                returns: "returns (mapping (uint => bytes) storage, string memory, bytes storage)",
                body: `{
    string memory x;
    bytes storage t1 = t[0];

    return (t, x, t1);
}`
            }
        ]
    ],
    [
        "free fun foo6",
        `function foo6(uint x, uint[] memory y, mapping (uint => bytes) storage t) view returns (mapping (uint => bytes) storage, string memory, bytes storage) {
    string memory x;
    bytes storage t1 = t[0];

    return (t, x, t1);
}`,
        [
            {
                kind: "function",
                name: "foo6",
                args: "(uint x, uint[] memory y, mapping (uint => bytes) storage t)",
                mutability: "view",
                returns: "returns (mapping (uint => bytes) storage, string memory, bytes storage)",
                body: `{
    string memory x;
    bytes storage t1 = t[0];

    return (t, x, t1);
}`
            }
        ]
    ],
    [
        "free fun foo7",
        `function foo7(uint x) view returns (uint y) {
    for (uint i = 0; i < x; i++) {
        if (i > 5) {
            // haha
        } else {
            // hoho
        }
    }
    return 1;
}`,
        [
            {
                kind: "function",
                name: "foo7",
                args: "(uint x)",
                mutability: "view",
                returns: "returns (uint y)",
                body: `{
    for (uint i = 0; i < x; i++) {
        if (i > 5) {
            // haha
        } else {
            // hoho
        }
    }
    return 1;
}`
            }
        ]
    ],
    [
        "free fun foo8",
        `function /* soo */ foo8(uint x, // many
 /* comments */ uint[/***/]  /* you*/ memory y, mapping (uint  /*wouldnt*/=> bytes) storage t) /*believe*/ view
  returns (mapping (uint
   => bytes) storage, string memory, bytes storage) {
    string memory x;
    /* it */
    bytes storage t1 = t[0]; // for

    return (t, x, t1); //realzies
} // bruh`,
        [
            {
                kind: "function",
                name: "foo8",
                args: `(uint x, // many
 /* comments */ uint[/***/]  /* you*/ memory y, mapping (uint  /*wouldnt*/=> bytes) storage t)`,
                mutability: "view",
                returns: `returns (mapping (uint
   => bytes) storage, string memory, bytes storage)`,
                body: `{
    string memory x;
    /* it */
    bytes storage t1 = t[0]; // for

    return (t, x, t1); //realzies
}`
            }
        ]
    ],
    [
        "library Brah",
        `library Brah {}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "library",
                name: "Brah",
                bases: null,
                body: "{}"
            }
        ]
    ],
    [
        "contract Foo",
        `contract Foo {}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "contract",
                name: "Foo",
                bases: null,
                body: "{}"
            }
        ]
    ],
    [
        "contract Foo1",
        `abstract contract Foo1 {}`,
        [
            {
                abstract: true,
                kind: "contract",
                contractKind: "contract",
                name: "Foo1",
                bases: null,
                body: "{}"
            }
        ]
    ],
    [
        "interface Moo",
        `interface Moo {}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "interface",
                name: "Moo",
                bases: null,
                body: "{}"
            }
        ]
    ],
    [
        "contract Bar",
        `contract Bar is Foo {
    constructor(uint x) {}
}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "contract",
                name: "Bar",
                bases: "Foo",
                body: `{
    constructor(uint x) {}
}`
            }
        ]
    ],
    [
        "contract Boo",
        `contract Boo is Foo, Bar(1) {
    constructor(uint x, uint y) {}
}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "contract",
                name: "Boo",
                bases: "Foo, Bar(1)",
                body: `{
    constructor(uint x, uint y) {}
}`
            }
        ]
    ],
    [
        "contract Baz",
        `contract /* soo */ Baz
/* much*/ is /* comment */ Boo(1,//wow
/*such */2 /*whitespace*/) /**/
{
    int // so
    a;
    function /*cray*/ foo() public pure { 
        string memory t = "}}*\\*";
    }
}`,
        [
            {
                abstract: false,
                kind: "contract",
                contractKind: "contract",
                name: "Baz",
                bases: `Boo(1,//wow
/*such */2 /*whitespace*/)`,
                body: `{
    int // so
    a;
    function /*cray*/ foo() public pure { 
        string memory t = "}}*\\*";
    }
}`
            }
        ]
    ],
    [
        "struct A",
        `struct A {
    uint x;
}`,
        [
            {
                kind: "struct",
                name: "A",
                body: `{
    uint x;
}`
            }
        ]
    ],
    [
        "struct B",
        `struct /** wow*/ B // reeeeal shit?
{
    uint /** why doe? */ z/**/;/***/
/****/}`,
        [
            {
                kind: "struct",
                name: "B",
                body: `{
    uint /** why doe? */ z/**/;/***/
/****/}`
            }
        ]
    ],
    [
        "enum EA",
        `enum EA {
    A, B,
    C
}`,
        [
            {
                kind: "enum",
                name: "EA",
                body: `{
    A, B,
    C
}`
            }
        ]
    ],
    [
        "enum EB",
        `enum  /*1*/ EB //2
 { /*3*/
    A,/*3*/ B/**/,
    C//5
}`,
        [
            {
                kind: "enum",
                name: "EB",
                body: `{ /*3*/
    A,/*3*/ B/**/,
    C//5
}`
            }
        ]
    ],
    [
        "type T1",
        `type T1 is uint;`,
        [
            {
                kind: "userValueType",
                name: "T1",
                valueType: `uint`
            }
        ]
    ],
    [
        "type T2",
        `type T2 is bytes4;`,
        [
            {
                kind: "userValueType",
                name: "T2",
                valueType: `bytes4`
            }
        ]
    ],
    [
        "type T3",
        `type /*1*/ T3  //2
is /*3*/ int24;`,
        [
            {
                kind: "userValueType",
                name: "T3",
                valueType: `int24`
            }
        ]
    ],
    [
        "type T4",
        `type /*1*/ T4  //2
is /*3*/ int24/*;*/;`,
        [
            {
                kind: "userValueType",
                name: "T4",
                valueType: `int24/*;*/`
            }
        ]
    ],
    [
        "pragma solidity ^0.8.8;",
        `pragma solidity ^0.8.8;`,
        [
            {
                kind: "pragma",
                name: "solidity",
                value: `^0.8.8`
            }
        ]
    ],
    [
        "pragma experimental ABIEncoderV2;",
        `pragma experimental ABIEncoderV2;`,
        [
            {
                kind: "pragma",
                name: "experimental",
                value: `ABIEncoderV2`
            }
        ]
    ],
    [
        "pragma with comments",
        `pragma /*;*/ solidity // oh yeah;
0.8.9/*;*/;`,
        [
            {
                kind: "pragma",
                name: "solidity",
                value: `0.8.9/*;*/`
            }
        ]
    ],
    [
        "using-for library global",
        `using /*;*/ A for XXX global; // oh yeah;`,
        [
            {
                kind: "usingForDirective",
                typeName: "XXX",
                isGlobal: true,
                libraryName: "A"
            }
        ]
    ],
    [
        "using-for library locally",
        `using B for YYY;`,
        [
            {
                kind: "usingForDirective",
                typeName: "YYY",
                isGlobal: false,
                libraryName: "B"
            }
        ]
    ],
    [
        "using-for tuple globally",
        `using {a, /*!!*/ b, /*!!*/ L.c} for ZZZ /*!!*/ global;`,
        [
            {
                kind: "usingForDirective",
                typeName: "ZZZ",
                isGlobal: true,
                functionList: ["a", "b", "L.c"]
            }
        ]
    ],
    [
        "using-for tuple locally",
        `using {a, b, L.c} for TTT;`,
        [
            {
                kind: "usingForDirective",
                typeName: "TTT",
                isGlobal: false,
                functionList: ["a", "b", "L.c"]
            }
        ]
    ],
    [
        "using-for custamizable operators",
        `using {op.RedLib.toScore, op.RedLib.exp, op.addRed as +, op.mulRed as *, op.unsubRed as -, op.lteRed as <=, op.gteRed as >=} for Red global;`,
        [
            {
                kind: "usingForDirective",
                typeName: "Red",
                isGlobal: true,
                functionList: [
                    "op.RedLib.toScore",
                    "op.RedLib.exp",
                    {
                        operator: "+",
                        name: "op.addRed"
                    },
                    {
                        operator: "*",
                        name: "op.mulRed"
                    },
                    {
                        operator: "-",
                        name: "op.unsubRed"
                    },
                    {
                        operator: "<=",
                        name: "op.lteRed"
                    },
                    {
                        operator: ">=",
                        name: "op.gteRed"
                    }
                ]
            }
        ]
    ],
    [
        "event definition",
        `event MyEvent(uint a indexed, address b);`,
        [
            {
                kind: "event",
                name: "MyEvent",
                args: "(uint a indexed, address b)",
                anonymous: false
            }
        ]
    ],
    [
        "event definition (anonymous)",
        `event MyAnonymousEvent(uint x indexed) anonymous;`,
        [
            {
                kind: "event",
                name: "MyAnonymousEvent",
                args: "(uint x indexed)",
                anonymous: true
            }
        ]
    ],
    [
        "address payable",
        `address payable constant MY_CONST = payable(0x0);
        event MyEvent(address payable indexed addr);
        error MyError(address payable addr);`,
        [
            {
                kind: "constant",
                name: "MY_CONST",
                value: "payable(0x0)"
            },
            {
                kind: "event",
                name: "MyEvent",
                args: "(address payable indexed addr)"
            },
            {
                kind: "error",
                name: "MyError",
                args: "(address payable addr)"
            }
        ]
    ]
];

/**
 * Checks that a and b have the same number of nodes, and for each a_i and b_i,
 * where a_i and b_i are objects, b_i is a "subset" of a_i
 */
function expectTopLevelNodesMatch(a: any[], b: any[]) {
    // Uncomment the next line to see the parsed nodes for which the match fails
    // console.error(`a: ${JSON.stringify(a)} b: ${JSON.stringify(b)}`);
    expect(a.length).toEqual(b.length);

    for (let i = 0; i < a.length; i++) {
        expect(a[i]).toMatchObject(b[i]);
    }
}

describe("File-level definitions parser unit tests", () => {
    for (const [name, sample, expected] of good_samples) {
        it(`${name} should parse successfully`, () => {
            const parsed = parseFileLevelDefinitions(sample);

            expectTopLevelNodesMatch(parsed, expected);
        });
    }
});

const SAMPLES_DIR =
    process.env.SOLC_SAMPLES_TEST_DIR === undefined
        ? "test/samples/solidity"
        : process.env.SOLC_SAMPLES_TEST_DIR;

describe("File-level definitions parser samples test", () => {
    for (const fileName of searchRecursive(SAMPLES_DIR, (name) => name.endsWith(".sol"))) {
        it(fileName, () => {
            const contents = fse.readFileSync(fileName).toString();

            let tlds;

            try {
                tlds = parseFileLevelDefinitions(contents);
            } catch (e: any) {
                fail(
                    `Failed compiling ${fileName}: msg: ${e.message}  loc: ${JSON.stringify(
                        e.location,
                        undefined,
                        2
                    )}`
                );
            }

            expect(tlds.length).toBeGreaterThan(0);
        });
    }
});
