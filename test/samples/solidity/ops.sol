pragma solidity ^0.4.24;

contract Misc {
    function testMisc() public {
        2 / 5;
        10 + 10;
        false ? 1 : 300;
        2 + (true ? 200 : 100) + 3;
        (1);

        true && false;
    }
}

contract UnaryOps {
    function testArithmeticOperators() public {
        // ++ and -- are node considered here, as these operators are not applicable to literals.

        assert(-(-5) == 5);
        assert(-(5) == -5);
    }

    function testBitwiseOperators() public {
        assert(~8 == -9);
        assert(~(-9) == 8);
        assert(~0 == -1);
        assert(~(-1) == 0);
    }

    function testLogicOperators() public {
        assert(!false == true);
        assert(!true == false);

        assert(!!true == true);
        assert(!!false == false);
    }

    function testDelete() public {
        // ignore delete as this operator is not applicable to literal.
    }
}

contract BinaryOps {
    bytes2 public constant x = bytes2(0x0100) | bytes2(0x0001);

    function testArithmeticOperators() public {
        assert(10 + 15 == 25);
        assert(-10 + -15 == -25);

        assert(10 - 15 == -5);
        assert(-10 - -15 == 5);

        assert(10 * 15 == 150);
        assert(-10 * -15 == 150);

        assert(20 / 10 == 2);
        assert(-20 / -10 == 2);

        assert(25 % 10 == 5);
        assert(-25 % -10 == -5);

        assert(0 ** 0 == 1);
        assert(5 ** 8 == 390625);
        assert(2 ** 64 == 18446744073709551616);
    }

    function testBitwiseOperators() public {
        assert(2 << 5 == 64);
        assert(2 << 100 == 2535301200456458802993406410752);

        assert(126 >> 3 == 15);
        assert(2535301200456458802993406410752 >> 100 == 2);

        assert(11 | 116 == 127);
        assert(-11 | -116 == -3);

        assert(10 & 3 == 2);
        assert(-10 & -3 == -12);

        assert(8 ^ 10 == 2);
        assert(-8 ^ -10 == 14);
    }

    function testLogicOperators() public {
        assert(2 < 1 == false);
        assert(1 < 2 == true);
        assert(2 < 2 == false);

        assert(2 > 1 == true);
        assert(1 > 2 == false);
        assert(2 > 2 == false);

        assert(2 >= 1 == true);
        assert(1 >= 2 == false);
        assert(2 >= 2 == true);

        assert(2 <= 1 == false);
        assert(1 <= 2 == true);
        assert(2 <= 2 == true);

        assert(2 == 1 == false);
        assert(1 == 2 == false);
        assert(2 == 2 == true);

        assert(2 != 1 == true);
        assert(2 != 2 == false);

        assert(true && true == true);
        assert(true && false == false);
        assert(false && false == false);

        assert(true || true == true);
        assert(true || false == true);
        assert(false || false == false);
    }

    function testOperatorsOnBitTypes() public {
        assert(uint16(bytes2(0x0001)) == 1);

        assert(bytes2(0xff00) == bytes2(0xff00));
        assert(bytes2(0xff00) == byte(0xff));
        assert(bytes2(0xff00) > bytes1(0xee));
        assert(bytes2(0xff00) > 0xeeff);
        assert(bytes2(0xcc00) < byte(0xee));
        assert(bytes2(0xffff) != bytes2(0xcccc));
        assert(bytes2(0xffff) != 0xcccc);

        assert(byte(0x30) < 'A');
        assert(bytes2(0xFFFF) > 'AZ');
        assert(bytes2(0xFFFF) > 'A');
        assert(bytes3(0x414243) >= 'ABC');
        assert(bytes3(0x414244) >= 'ABC');
        assert(bytes3(0x414243) == 'ABC');
        assert(bytes3(0x414243) <= 'ABC');
        assert(bytes3(0x414242) <= 'ABC');
        assert(bytes3(0x414245) != 'ABC');

        assert(bytes4(0x01010101) | bytes4(0x10101010) == 0x11111111);
        assert(bytes4(0x01111101) & bytes4(0x11111111) == 0x01111101);
        assert(bytes4(0x00000001) << 16 == 0x00010000);
        // assert(byte(0x01) << 8 == 0x00);
        assert(bytes4(0x10000000) >> 16 == 0x00001000);
        assert(bytes4(0x00011110) ^ bytes4(0x00101101) == 0x00110011);
        assert(~bytes4(0xF0FF000F) == 0x0f00fff0);
        assert(~bytes4(0xFFFFFFFF) == 0);
        assert(~bytes4(0x00000000) == 0xFFFFFFFF);
    }
}