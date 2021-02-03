pragma solidity ^0.5.0;

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
        int8 memberC;
        address memberD;
    }

    uint a;
    uint256 b;
    TestStructB c;
    TestEnum d;

    constructor() public {
        a = 1;
        b = 100000000000;
        c = TestStructB(TestStructA("x", 2, TestEnum.C), "b", 5, address(0x0));
    }

    function testTimeUnits() public pure returns (uint) {
        uint valid = 0;

        if (1 == 1 seconds)valid++;
        if (1 minutes == 60 seconds)valid++;
        if (1 hours == 60 minutes)valid++;
        if (1 days == 24 hours)valid++;
        if (1 weeks == 7 days)valid++;

        return valid;
    }

    function testControlStructures(int32 x) public pure {
        if (x == 1) {
            x += 1;
        } else {
            x += 2;
        }

        x == 1 ? x += 1 : x += 2;

        x = 2;

        while (x < 10) {
            x += 1;
        }

        for (uint y =1; y < 10; y++){
            if (y == 4) {
                continue;
            } else if (y == 5) {
                break;
            }
        }

        for (;;) break;

        while (true) break;

        if (true) revert();
    }

    function testArgsAndReturn (int32[] memory i, TestStructB memory o, TestEnum p) internal pure returns (int32[] memory x, TestStructB memory y, TestEnum z) {
        return (i, o, p);
    }
}
