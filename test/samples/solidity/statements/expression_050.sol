pragma solidity ^0.5.0;

contract TestExpressionStatement {
    function single(int x) public {
        1 + 2;
    }

    function multiple() public {
        int x = 0;

        (int a, int b) = (1, 2);

        (b, a) = (a, b);

        x = x + a - b;

        x > 10 || x == 10;
    }

    function nested() public {
        int x;

        for (x = 0; x < 10; x++) {
            x += 2;
        }

        x++;
    }
}
