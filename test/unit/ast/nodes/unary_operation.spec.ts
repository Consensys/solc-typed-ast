import expect from "expect";
import {
    ASTContext,
    Block,
    FunctionDefinition,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    Literal,
    LiteralKind,
    ParameterList,
    UnaryOperation
} from "../../../../src";

describe("UnaryOperation", () => {
    it("get/set vUserFunction", () => {
        const context = new ASTContext();

        const body = new Block(1, "0:0:0", []);
        const args = new ParameterList(2, "0:0:0", []);
        const rets = new ParameterList(3, "0:0:0", []);
        const fn = new FunctionDefinition(
            4,
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

        const literal = new Literal(5, "0:0:0", "uint256", LiteralKind.Number, "", "1");

        const operation = new UnaryOperation(6, "0:0:0", "CustomType", false, "-", literal);

        context.register(body, args, rets, fn, literal, operation);

        operation.vUserFunction = fn;

        expect(operation.userFunction).toEqual(fn.id);
        expect(operation.vUserFunction === fn).toBeTruthy();

        operation.vUserFunction = undefined;

        expect(operation.userFunction).toBeUndefined();
        expect(operation.vUserFunction).toBeUndefined();

        context.unregister(fn);

        expect(() => {
            operation.vUserFunction = fn;
        }).toThrow();

        operation.userFunction = literal.id;

        expect(() => {
            operation.vUserFunction;
        }).toThrow();
    });
});
