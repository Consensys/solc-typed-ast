pragma solidity ^0.4.13;

contract TestConditional {
    function conditionalSimple(uint a) public returns (uint) {
        return a > 10 ? 10 : 15;
    }

    function conditionalWithNested(uint a) public returns (uint) {
        return (a > 10 ? true : false)
            ? a > 15 ? 20 : a
            : a < 5 ? a : 0;
    }

    function conditionalWithComplexExpressions(uint a) public returns (uint) {
        return a % 2 == 0 ? this.sqrt(a) + 10 : a * 6 / 2;
    }

    function sqrt(uint x) public returns (uint y) {
        uint z = (x + 1) / 2;

        y = x;

        while (z < y) {
            y = z;

            z = (x / z + z) / 2;
        }
    }
}
