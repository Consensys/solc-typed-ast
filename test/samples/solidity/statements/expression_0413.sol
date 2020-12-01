pragma solidity ^0.4.13;

contract TestExpressionStatement {
    function single(int x) public {
        1 + 2;
    }

    function multiple() public {
        int x = 0;

        var (a, b) = (1, 2);

        (b, a) = (a, b);

        x = x + a - b;

        x > 10 || x == 10;
    }

    function nested() public {
        int x;

        for (x = 0; x < 10; x++) {
            if (x < 10) {
                x += 2;
            }
        }

        x++;
    }
}
