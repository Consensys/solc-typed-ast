import expect from "expect";
import {
    ASTContext,
    ContractDefinition,
    ContractKind,
    EnumDefinition,
    SourceUnit
} from "../../../../src";

describe("ContractDefinition", () => {
    it("set vScope", () => {
        const context = new ASTContext();
        const unit = new SourceUnit(1, "0:0:0", "entry.sol", 0, "entry.sol", new Map());
        const otherUnit = new SourceUnit(2, "0:0:0", "other.sol", 1, "other.sol", new Map());

        const contract = new ContractDefinition(
            3,
            "0:0:0",
            "MyContract",
            0,
            ContractKind.Contract,
            false,
            true,
            [3],
            [],
            [],
            undefined,
            []
        );

        context.register(unit, contract);

        contract.vScope = unit;

        expect(contract.scope).toEqual(unit.id);
        expect(contract.vScope === unit).toBeTruthy();

        expect(() => {
            contract.vScope = otherUnit;
        }).toThrow();
    });

    describe("removeChild()", () => {
        it("Single child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);

            const contract = new ContractDefinition(
                2,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [2],
                [],
                [],
                undefined,
                [myEnum1]
            );

            const node = contract.removeChild(myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(contract.children.length).toEqual(0);
            expect(contract.firstChild).toBeUndefined();
            expect(contract.lastChild).toBeUndefined();
            expect(contract.vEnums).toEqual([]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();
        });

        it("First child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const contract = new ContractDefinition(
                3,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [3],
                [],
                [],
                undefined,
                [myEnum1, myEnum2]
            );

            const node = contract.removeChild(myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(contract.children.length).toEqual(1);
            expect(contract.firstChild === myEnum2).toBeTruthy();
            expect(contract.lastChild === myEnum2).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum2]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();

            expect(myEnum2.previousSibling).toBeUndefined();
            expect(myEnum2.nextSibling).toBeUndefined();
        });

        it("Last child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const contract = new ContractDefinition(
                3,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [3],
                [],
                [],
                undefined,
                [myEnum1, myEnum2]
            );

            const node = contract.removeChild(myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(contract.children.length).toEqual(1);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum1).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();

            expect(myEnum1.previousSibling).toBeUndefined();
            expect(myEnum1.nextSibling).toBeUndefined();
        });

        it("Middle child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);

            const contract = new ContractDefinition(
                4,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [4],
                [],
                [],
                undefined,
                [myEnum1, myEnum2, myEnum3]
            );

            const node = contract.removeChild(myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(contract.children.length).toEqual(2);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum3).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1, myEnum3]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();

            expect(myEnum1.nextSibling === myEnum3).toBeTruthy();
            expect(myEnum3.previousSibling === myEnum1).toBeTruthy();
        });
    });

    describe("insertBefore()", () => {
        it("First child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const contract = new ContractDefinition(
                3,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [3],
                [],
                [],
                undefined,
                [myEnum1]
            );

            const node = contract.insertBefore(myEnum2, myEnum1);

            expect(node === myEnum2).toBeTruthy();

            expect(contract.children.length).toEqual(2);
            expect(contract.firstChild === myEnum2).toBeTruthy();
            expect(contract.lastChild === myEnum1).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum2, myEnum1]);

            expect(node.parent === contract).toBeTruthy();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling === myEnum1).toBeTruthy();

            expect(myEnum1.previousSibling === node).toBeTruthy();
        });

        it("Last child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);

            const contract = new ContractDefinition(
                4,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [4],
                [],
                [],
                undefined,
                [myEnum1, myEnum2]
            );

            const node = contract.insertBefore(myEnum3, myEnum2);

            expect(node === myEnum3).toBeTruthy();

            expect(contract.children.length).toEqual(3);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum2).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1, myEnum3, myEnum2]);

            expect(node.parent === contract).toBeTruthy();
            expect(node.previousSibling === myEnum1).toBeTruthy();
            expect(node.nextSibling === myEnum2).toBeTruthy();

            expect(myEnum1.nextSibling === myEnum3).toBeTruthy();
            expect(myEnum2.previousSibling === myEnum3).toBeTruthy();
        });
    });

    describe("insertAfter()", () => {
        it("Last child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const contract = new ContractDefinition(
                3,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [3],
                [],
                [],
                undefined,
                [myEnum1]
            );

            const node = contract.insertAfter(myEnum2, myEnum1);

            expect(node === myEnum2).toBeTruthy();

            expect(contract.children.length).toEqual(2);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum2).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1, myEnum2]);

            expect(node.parent === contract).toBeTruthy();
            expect(node.nextSibling).toBeUndefined();
            expect(node.previousSibling === myEnum1).toBeTruthy();

            expect(myEnum1.nextSibling === node).toBeTruthy();
        });

        it("First child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);

            const contract = new ContractDefinition(
                4,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [4],
                [],
                [],
                undefined,
                [myEnum1, myEnum2]
            );

            const node = contract.insertAfter(myEnum3, myEnum1);

            expect(node === myEnum3).toBeTruthy();

            expect(contract.children.length).toEqual(3);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum2).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1, myEnum3, myEnum2]);

            expect(node.parent === contract).toBeTruthy();
            expect(node.previousSibling === myEnum1).toBeTruthy();
            expect(node.nextSibling === myEnum2).toBeTruthy();
        });
    });

    describe("replaceChild()", () => {
        it("Single child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const contract = new ContractDefinition(
                3,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [3],
                [],
                [],
                undefined,
                [myEnum1]
            );

            const node = contract.replaceChild(myEnum2, myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(contract.children.length).toEqual(1);
            expect(contract.firstChild === myEnum2).toBeTruthy();
            expect(contract.lastChild === myEnum2).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum2]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();
        });

        it("Middle child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);
            const myEnum4 = new EnumDefinition(4, "0:0:0", "MyEnum4", []);

            const contract = new ContractDefinition(
                5,
                "0:0:0",
                "MyContract",
                0,
                ContractKind.Contract,
                false,
                true,
                [5],
                [],
                [],
                undefined,
                [myEnum1, myEnum2, myEnum3]
            );

            const node = contract.replaceChild(myEnum4, myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(contract.children.length).toEqual(3);
            expect(contract.firstChild === myEnum1).toBeTruthy();
            expect(contract.lastChild === myEnum3).toBeTruthy();
            expect(contract.vEnums).toEqual([myEnum1, myEnum4, myEnum3]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();

            expect(myEnum1.nextSibling === myEnum4).toBeTruthy();
            expect(myEnum4.previousSibling === myEnum1).toBeTruthy();

            expect(myEnum3.previousSibling === myEnum4).toBeTruthy();
            expect(myEnum4.nextSibling === myEnum3).toBeTruthy();
        });
    });
});
