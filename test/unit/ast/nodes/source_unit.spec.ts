import expect from "expect";
import { EnumDefinition, SourceUnit } from "../../../../src";

describe("SourceUnit", () => {
    describe("removeChild()", () => {
        it("Single child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);

            const unit = new SourceUnit(
                2,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1]
            );

            const node = unit.removeChild(myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(unit.children.length).toEqual(0);
            expect(unit.firstChild).toBeUndefined();
            expect(unit.lastChild).toBeUndefined();
            expect(unit.vEnums).toEqual([]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();
        });

        it("First child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const unit = new SourceUnit(
                3,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2]
            );

            const node = unit.removeChild(myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(unit.children.length).toEqual(1);
            expect(unit.firstChild === myEnum2).toBeTruthy();
            expect(unit.lastChild === myEnum2).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum2]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();

            expect(myEnum2.previousSibling).toBeUndefined();
            expect(myEnum2.nextSibling).toBeUndefined();
        });

        it("Last child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const unit = new SourceUnit(
                3,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2]
            );

            const node = unit.removeChild(myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(unit.children.length).toEqual(1);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum1).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1]);

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

            const unit = new SourceUnit(
                4,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2, myEnum3]
            );

            const node = unit.removeChild(myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(unit.children.length).toEqual(2);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum3).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1, myEnum3]);

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

            const unit = new SourceUnit(
                3,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1]
            );

            const node = unit.insertBefore(myEnum2, myEnum1);

            expect(node === myEnum2).toBeTruthy();

            expect(unit.children.length).toEqual(2);
            expect(unit.firstChild === myEnum2).toBeTruthy();
            expect(unit.lastChild === myEnum1).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum2, myEnum1]);

            expect(node.parent === unit).toBeTruthy();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling === myEnum1).toBeTruthy();

            expect(myEnum1.previousSibling === node).toBeTruthy();
        });

        it("Last child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);

            const unit = new SourceUnit(
                4,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2]
            );

            const node = unit.insertBefore(myEnum3, myEnum2);

            expect(node === myEnum3).toBeTruthy();

            expect(unit.children.length).toEqual(3);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum2).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1, myEnum3, myEnum2]);

            expect(node.parent === unit).toBeTruthy();
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

            const unit = new SourceUnit(
                3,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1]
            );

            const node = unit.insertAfter(myEnum2, myEnum1);

            expect(node === myEnum2).toBeTruthy();

            expect(unit.children.length).toEqual(2);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum2).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1, myEnum2]);

            expect(node.parent === unit).toBeTruthy();
            expect(node.nextSibling).toBeUndefined();
            expect(node.previousSibling === myEnum1).toBeTruthy();

            expect(myEnum1.nextSibling === node).toBeTruthy();
        });

        it("First child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);

            const unit = new SourceUnit(
                4,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2]
            );

            const node = unit.insertAfter(myEnum3, myEnum1);

            expect(node === myEnum3).toBeTruthy();

            expect(unit.children.length).toEqual(3);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum2).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1, myEnum3, myEnum2]);

            expect(node.parent === unit).toBeTruthy();
            expect(node.previousSibling === myEnum1).toBeTruthy();
            expect(node.nextSibling === myEnum2).toBeTruthy();
        });
    });

    describe("replaceChild()", () => {
        it("Single child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);

            const unit = new SourceUnit(
                3,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1]
            );

            const node = unit.replaceChild(myEnum2, myEnum1);

            expect(node === myEnum1).toBeTruthy();

            expect(unit.children.length).toEqual(1);
            expect(unit.firstChild === myEnum2).toBeTruthy();
            expect(unit.lastChild === myEnum2).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum2]);

            expect(node.parent).toBeUndefined();
            expect(node.previousSibling).toBeUndefined();
            expect(node.nextSibling).toBeUndefined();
        });

        it("Middle child", () => {
            const myEnum1 = new EnumDefinition(1, "0:0:0", "MyEnum1", []);
            const myEnum2 = new EnumDefinition(2, "0:0:0", "MyEnum2", []);
            const myEnum3 = new EnumDefinition(3, "0:0:0", "MyEnum3", []);
            const myEnum4 = new EnumDefinition(4, "0:0:0", "MyEnum4", []);

            const unit = new SourceUnit(
                5,
                "0:0:0",
                "../sample.sol",
                0,
                "path/to/sample.sol",
                new Map(),
                [myEnum1, myEnum2, myEnum3]
            );

            const node = unit.replaceChild(myEnum4, myEnum2);

            expect(node === myEnum2).toBeTruthy();

            expect(unit.children.length).toEqual(3);
            expect(unit.firstChild === myEnum1).toBeTruthy();
            expect(unit.lastChild === myEnum3).toBeTruthy();
            expect(unit.vEnums).toEqual([myEnum1, myEnum4, myEnum3]);

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
