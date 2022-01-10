import expect from "expect";
import { parse } from "../../../src/compile/inference/top_level_definitions_parser";

const good_samples: Array<[string, string, any]> = [
    // Imports
    ["import1", `import "a.sol";`, [{ path: "a.sol", unitAlias: undefined, symbolAliases: [] }]],
    [
        "import2",
        `import {foo} from "a.sol";`,
        [{ path: "a.sol", symbolAliases: [{ alias: null, name: "foo" }], unitAlias: undefined }]
    ],
    [
        "import3",
        `import {foo as bar} from "a.sol";`,
        [{ path: "a.sol", symbolAliases: [{ alias: "bar", name: "foo" }], unitAlias: undefined }]
    ],
    ["import4", `import "a.sol" as boo;`, [{ path: "a.sol", symbolAliases: [], unitAlias: "boo" }]],
    [
        "import5",
        `/*sup brah */ import "a.sol" as boo;`,
        [{ path: "a.sol", symbolAliases: [], unitAlias: "boo" }]
    ],
    [
        "import6",
        `/*sup brah */ import /* import foo */ "a.sol" /* boo * */ as /* mo*o */ /**/ /* */ boo; // for realzies?`,
        [{ path: "a.sol", symbolAliases: [], unitAlias: "boo" }]
    ],

    // Constants
    ["constant1", "uint constant a = 1;", [{ name: "a", type: "constant", value: "1" }]],
    [
        "constant2",
        `string constant a = "asdfasd; nasdf (;)}{;/**/ // /*";`,
        [{ name: "a", type: "constant", value: `"asdfasd; nasdf (;)}{;/**/ // /*"` }]
    ],
    [
        "constant3",
        `string constant a = 'asdfasd; nasdf (;)}{;/**/ // /*';`,
        [{ name: "a", type: "constant", value: `'asdfasd; nasdf (;)}{;/**/ // /*'` }]
    ],

    // Free functions
    [
        "free fun foo0",
        `function foo0() {}`,
        [{ type: "function", name: "foo0", args: "()", mutability: "", returns: null, body: "{}" }]
    ],
    [
        "free fun foo1",
        `function foo1(uint x) {}`,
        [
            {
                type: "function",
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
                type: "function",
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
                type: "function",
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
                type: "function",
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
                type: "function",
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
                type: "function",
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
                type: "function",
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
                type: "function",
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
                contract_kind: "library",
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
                contract_kind: "contract",
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
                contract_kind: "contract",
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
                contract_kind: "interface",
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
                contract_kind: "contract",
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
                contract_kind: "contract",
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
                contract_kind: "contract",
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
    ]
];

/**
 * Checks that a and b have the same number of nodes, and for each a_i and b_i,
 * where a_i and b_i are objects, b_i is a "subset" of a_i
 */
function expectTopLevelNodesMatch(a: any[], b: any[]) {
    // Uncomment the next line to see the parsed nodes for which the match fails
    //console.error(`a: ${JSON.stringify(a)} b: ${JSON.stringify(b)}`);
    expect(a.length).toEqual(b.length);

    for (let i = 0; i < a.length; i++) {
        expect(a[i]).toMatchObject(b[i]);
    }
}

describe("Top-level definitions parser positive tests", () => {
    for (const [name, sample, expectedParsed] of good_samples) {
        it(`Sample ${name} should parse successfully`, () => {
            const parsed = parse(sample);

            //expect(parsed).toContainEqual(expectedParsed);
            expectTopLevelNodesMatch(parsed, expectedParsed);
        });
    }
});
