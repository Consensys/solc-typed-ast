// ------------------------------------------------------------
// /test/samples/solidity/statements/if_0413.sol
// ------------------------------------------------------------
pragma solidity ^0.4.13;

contract TestIf {
    function ifWithExpression() public {
        int a = 0;
        int b = 1;
        if ((a < 1)) b = (b + 10);
    }

    function ifElseWithExpressions() public {
        int a = 0;
        int b = 1;
        if ((a < 1)) b = (a + 10); else b = (a - 10);
    }

    function ifWithBlock() public {
        int a = 0;
        int b = 1;
        if ((a < 1)) {
            b = (a + 10);
            a = ((b * b) - 5);
        }
    }

    function ifElseWithBlocks() public {
        int a = 0;
        int b = 1;
        if ((a < 1)) {
            b = (a + 10);
            a = ((b * b) - 5);
        } else {
            b = (a - 10);
            a = ((b * b) + 5);
        }
    }
}
