// ------------------------------------------------------------
// test/samples/solidity/compile_04.sol
// ------------------------------------------------------------
pragma solidity ^0.4.13;

contract Simple {
    enum TestEnum {
        A,
        B,
        C
    }

    struct TestStructA {
        string memberX;
        int memberY;
        TestEnum memberZ;
    }

    struct TestStructB {
        TestStructA memberA;
        string memberB;
        bytes8 memberC;
        address memberD;
    }

    uint internal a;
    uint256 internal b;
    TestStructB internal c;
    TestEnum internal d;

    function Simple() public {
        a = 1;
        b = 100000000000;
        c = TestStructB(TestStructA("x", 2, TestEnum.C), "b", 0x3, address(0x0));
    }

    function testTimeUnits() public view returns (uint) {
        uint valid = 0;
        if (1 == 1 seconds) valid++;
        if (1 minutes == 60 seconds) valid++;
        if (1 hours == 60 minutes) valid++;
        if (1 days == 24 hours) valid++;
        if (1 weeks == 7 days) valid++;
        if (1 years == 365 days) valid++;
        return valid;
    }

    function testControlStructures(int32 x) public {
        if (x == 1) {
            x += 1;
        } else {
            x += 2;
        }
        (x == 1) ? x += 1 : x += 2;
        x = 2;
        while (x < 10) {
            x += 1;
        }
        for (uint y = 1; y < 10; y++) {
            if (y == 4) {
                continue;
            } else if (y == 5) {
                break;
            }
        }
        for (; ; ) break;
        while (true) break;
        if (true) throw;
    }

    function testArgsAndReturn(int32[] i, TestStructB o, TestEnum p) internal returns (int32[] x, TestStructB y, TestEnum z) {
        return (i, o, p);
    }
}
