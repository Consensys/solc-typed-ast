import expect from "expect";
import {
    ASTContext,
    Block,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    ParameterList,
    SourceUnit
} from "../../../../src";

describe("FunctionDefinition", () => {
    it("set vScope", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(1, "0:0:0", "entry.sol", 0, "entry.sol", new Map());
        const otherUnit = new SourceUnit(2, "0:0:0", "other.sol", 1, "other.sol", new Map());

        const body = new Block(3, "0:0:0", []);
        const args = new ParameterList(4, "0:0:0", []);
        const rets = new ParameterList(5, "0:0:0", []);
        const fn = new FunctionDefinition(
            6,
            "0:0:0",
            0,
            FunctionKind.Free,
            "myFunc",
            false,
            FunctionVisibility.Internal,
            FunctionStateMutability.Pure,
            false,
            args,
            rets,
            [],
            undefined,
            body
        );

        context.register(unit, body, args, rets, fn);

        fn.vScope = unit;

        expect(fn.scope).toEqual(unit.id);
        expect(fn.vScope === unit).toBeTruthy();

        expect(() => {
            fn.vScope = otherUnit;
        }).toThrow();
    });
});
