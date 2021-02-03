// ------------------------------------------------------------
// /test/samples/solidity/statements/while_050.sol
// ------------------------------------------------------------
pragma solidity ^0.5.0;

contract TestWhile {
    function whileWithExpression() public {
        int a = 0;
        int b = 10;
        while (a < b) a += 5;
    }

    function whileWithBlock() public {
        int a = 0;
        int b = 10;
        while (a < b) {
            a += 2;
            b -= 1;
        }
    }
}
