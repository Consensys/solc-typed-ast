pragma solidity ^0.5.0;

contract TestDoWhile {
    function doWhileWithExpression() public {
        int a = 0;
        int b = 10;

        do a + 5;
        while (a < b);
    }

    function doWhileWithBlock() public {
        int a = 0;
        int b = 10;

        do {
            a += 2;
            b -= 1;
        } while (a < b);
    }
}