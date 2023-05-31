import expect from "expect";
import {
    ASTContext,
    ASTNode,
    ASTNodeFactory,
    ContractKind,
    ErrorType,
    EventType,
    FunctionKind,
    FunctionLikeSetType,
    FunctionStateMutability,
    FunctionVisibility,
    InferType,
    IntType,
    isPPAble,
    ModifierType,
    pp,
    ppArr,
    ppIter,
    ppMap,
    ppSet,
    StringType,
    SuperType,
    TVar,
    TypeNode
} from "../../../src";

const ctx = new ASTContext();

ctx.id = 555;

const factory = new ASTNodeFactory(ctx);

const elementaryTypeName = factory.makeElementaryTypeName("uint8", "uint8");
const contractDef = factory.makeContractDefinition(
    "SomeContract",
    0,
    ContractKind.Contract,
    false,
    true,
    [],
    [],
    []
);

const funA = factory.makeFunctionDefinition(
    0,
    FunctionKind.Function,
    "funA",
    false,
    FunctionVisibility.Default,
    FunctionStateMutability.View,
    false,
    factory.makeParameterList([]),
    factory.makeParameterList([]),
    []
);

const funB = factory.makeFunctionDefinition(
    0,
    FunctionKind.Function,
    "funB",
    false,
    FunctionVisibility.Default,
    FunctionStateMutability.View,
    false,
    factory.makeParameterList([]),
    factory.makeParameterList([]),
    []
);

const evA = factory.makeEventDefinition(false, "evA", factory.makeParameterList([]));
const evB = factory.makeEventDefinition(false, "evB", factory.makeParameterList([]));

const customPPAble = {
    name: "test",
    pp: () => "PPAble object"
};

describe("Utility formatting routines", () => {
    describe("isPPAble()", () => {
        const cases: Array<[any, boolean]> = [
            [{}, false],
            [[], false],
            [customPPAble, true]
        ];

        for (const [value, result] of cases) {
            it(`${JSON.stringify(value)} results ${result}`, () => {
                expect(isPPAble(value)).toEqual(result);
            });
        }
    });

    describe("pp()", () => {
        const infer = new InferType("0.8.15");

        const cases: Array<[any, string]> = [
            [1, "1"],
            [1n, "1"],
            ["abc", "abc"],
            [true, "true"],
            [false, "false"],
            [null, "null"],
            [undefined, "<undefined>"],
            [customPPAble, customPPAble.pp()],
            [elementaryTypeName, "ElementaryTypeName #1"],
            [contractDef, "ContractDefinition #2"],
            [ctx, "ASTContext #555"],
            [["x", 1, true, null], "[x,1,true,null]"],
            [new Set(["a", 2, false, null]), "{a,2,false,null}"],
            [
                new Map<string, boolean | number>([
                    ["x", true],
                    ["y", 100],
                    ["z", false]
                ]),
                "{x:true,y:100,z:false}"
            ],
            [
                (function* gen() {
                    yield 10;
                    yield 20;
                    yield 30;
                })(),
                "[10,20,30]"
            ],
            [
                new EventType("SomeEvent", [new IntType(256, true), new StringType()]),
                "event SomeEvent(int256,string)"
            ],
            [
                new ErrorType("SomeError", [new IntType(256, true), new StringType()]),
                "error SomeError(int256,string)"
            ],
            [
                new ModifierType("SomeModifier", [new IntType(256, true), new StringType()]),
                "modifier SomeModifier(int256,string)"
            ],
            [new SuperType(contractDef), "super(SomeContract#2)"],
            [
                new FunctionLikeSetType([infer.funDefToType(funA), infer.funDefToType(funB)]),
                "function_set { function () view, function () view }"
            ],
            [
                new FunctionLikeSetType([infer.eventDefToType(evA), infer.eventDefToType(evB)]),
                "event_set { event evA(), event evB() }"
            ],
            [new TVar("T"), "<TVar T>"]
        ];

        for (const [value, result] of cases) {
            it(`${
                value instanceof TypeNode || value instanceof ASTNode
                    ? value.constructor.name
                    : value
            } results ${result}`, () => {
                expect(pp(value)).toEqual(result);
            });
        }
    });

    describe("ppArr()", () => {
        const cases: Array<[any[], Array<string | undefined>, string]> = [
            [[1, 2, 3], [], "[1,2,3]"],
            [["x", "y", "z"], ["/", "<", ">"], "<x/y/z>"]
        ];

        for (const [value, options, result] of cases) {
            it(`${value} with options ${JSON.stringify(options)} results ${result}`, () => {
                expect(ppArr(value, ...options)).toEqual(result);
            });
        }
    });

    describe("ppIter()", () => {
        function makeIterable<T>(...array: T[]): Iterable<T> {
            return {
                *[Symbol.iterator]() {
                    for (const element of array) {
                        yield element;
                    }
                }
            };
        }

        const cases: Array<[Iterable<any>, Array<string | undefined>, string]> = [
            [[1, 2, 3], [], "[1,2,3]"],
            [new Set(["x", "y", "z"]), ["/", "<", ">"], "<x/y/z>"],
            [makeIterable<any>("1x", 2, "y3"), [], "[1x,2,y3]"]
        ];

        for (const [value, options, result] of cases) {
            const array = Array.from(value);

            it(`Iterable ${JSON.stringify(array)} with options ${JSON.stringify(
                options
            )} results ${result}`, () => {
                expect(ppIter(value, ...options)).toEqual(result);
            });
        }
    });

    describe("ppSet()", () => {
        const cases: Array<[Set<any>, Array<string | undefined>, string]> = [
            [new Set([1, 2, 3]), [], "{1,2,3}"],
            [new Set(["x", "y", "z"]), ["/", "<", ">"], "<x/y/z>"]
        ];

        for (const [value, options, result] of cases) {
            it(`${value} with options ${JSON.stringify(options)} results ${result}`, () => {
                expect(ppSet(value, ...options)).toEqual(result);
            });
        }
    });

    describe("ppMap()", () => {
        const map = new Map<string, number>([
            ["a", 0],
            ["b", 3],
            ["c", 1]
        ]);

        const cases: Array<[Map<any, any>, Array<string | undefined>, string]> = [
            [map, [], "{a:0,b:3,c:1}"],
            [map, ["/", " => ", "<", ">"], "<a => 0/b => 3/c => 1>"]
        ];

        for (const [value, options, result] of cases) {
            it(`${value} with options ${JSON.stringify(options)} results ${result}`, () => {
                expect(ppMap(value, ...options)).toEqual(result);
            });
        }
    });
});
