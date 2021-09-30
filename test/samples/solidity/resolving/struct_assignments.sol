pragma solidity ^0.6.0;

contract Foo {
    struct Simple {
        uint x;
        uint y;
    }

    struct Complex {
        uint len;
        uint[] arr;
    }

    Simple sV;
    Simple sV1;
    Complex cV;
    Complex cV1;

    function simple_tests() public {
        sV.x = 0;
        sV.y = 1;

        assert(sV.x == 0 && sV.y == 1);
        (sV.x, sV.y) = (3, 4);
        assert(sV.x == 3 && sV.y == 4);
        (sV.x, sV.y) = (sV.y, sV.x);
        assert(sV.x == 4 && sV.y == 3);

        sV = Simple({x: 5, y: 6});
        assert(sV.x == 5 && sV.y == 6);

        Simple memory mV = Simple({x: 7, y: 8});
        sV = mV;
        assert(sV.x == 7 && sV.y == 8);

        sV1 = sV;
        assert(sV1.x == 7 && sV1.y == 8);
    }

    function complex_tests() public {
        cV.len = 3;
        cV.arr = [1,2,3];
        assert(cV.len == 3 && cV.arr.length == 3);

        uint[] memory m = new uint[](2);
        cV = Complex(2, m);
        assert(cV.len == 2 && cV.arr.length == 2);
        
        cV1 = cV;
        assert(cV1.len == 2 && cV1.arr.length == 2);
        Complex memory mV = Complex(3, m);
        cV = mV;
        assert(cV.len == 3 && cV.arr.length == 2);
    }

    function main() public {
        simple_tests();
        complex_tests();
    }
}
