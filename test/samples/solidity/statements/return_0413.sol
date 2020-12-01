pragma solidity ^0.4.13;

contract TestReturn {
    function singleValueReturn() public returns (int a) {
        return 1;
    }

    function tupleValueReturn() public returns (int, string memory) {
        int a = 2;
        string memory b = "test";

        return (a, b);
    }

    function multipleReturns(int x) public returns (int) {
        for (int a = 0; a < 10; a++) {
            if (x * a > 100) {
                return x * a;
            }
        }

        return x;
    }

    function emptyReturn() public {
        return;
    }
}
