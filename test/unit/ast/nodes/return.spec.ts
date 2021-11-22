import expect from "expect";
import { ASTContext, ParameterList, Return } from "../../../../src";

describe("Return", () => {
    it("set vFunctionReturnParameters", () => {
        const context = new ASTContext();

        const rets = new ParameterList(1, "0:0:0", []);
        const otherRets = new ParameterList(2, "0:0:0", []);
        const ret = new Return(3, "0:0:0", 0);

        context.register(rets, ret);

        ret.vFunctionReturnParameters = rets;

        expect(ret.functionReturnParameters).toEqual(rets.id);
        expect(ret.vFunctionReturnParameters === rets).toBeTruthy();

        expect(() => {
            ret.vFunctionReturnParameters = otherRets;
        }).toThrow();
    });
});
